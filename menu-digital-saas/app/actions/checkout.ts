"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { MercadoPagoConfig, Preference } from "mercadopago";

// ── Checkout Form Schema ──

const CheckoutSchema = z.object({
  shopSlug: z.string(),
  deliveryType: z.enum(["delivery", "takeaway"]),
  scheduledDate: z.string().min(1, "Seleccioná una fecha"),
  scheduledTime: z.string().min(1, "Seleccioná un horario"),
  customerName: z.string().min(2, "Ingresá tu nombre"),
  customerPhone: z.string().min(8, "Teléfono inválido"),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["cash", "mercadopago", "transfer"]),
  notes: z.string().max(300).optional().or(z.literal("")),
  items: z.string(),
});

export async function processOrder(formData: FormData) {
  let parsed;
  try {
    parsed = CheckoutSchema.parse({
      shopSlug: formData.get("shopSlug"),
      deliveryType: formData.get("deliveryType"),
      scheduledDate: formData.get("scheduledDate"),
      scheduledTime: formData.get("scheduledTime"),
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      customerEmail: formData.get("customerEmail"),
      address: formData.get("address"),
      paymentMethod: formData.get("paymentMethod"),
      notes: formData.get("notes"),
      items: formData.get("items"),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.flatten().fieldErrors };
    }
    return { error: { _form: ["Error al procesar el pedido"] } };
  }

  let items: Array<{
    productId: string;
    productName: string;
    basePrice: number;
    totalPrice: number;
    selections?: Record<string, string[]>;
    specialNotes?: string;
  }>;
  try {
    items = JSON.parse(parsed.items);
  } catch {
    return { error: { _form: ["Carrito inválido"] } };
  }

  const shop = await prisma.shop.findUnique({ where: { slug: parsed.shopSlug } });
  if (!shop) return { error: { _form: ["Tienda no encontrada"] } };

  let userId: string | null = null;
  try {
    const user = await getAuthenticatedUser();
    userId = user.id;
  } catch {
    userId = null;
  }

  let subtotal = new Prisma.Decimal(0);
  const orderItemsData: Array<{
    productId: string;
    productName: string;
    unitPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
    specialNotes?: string;
    selectedOptions: Array<{ optionId: string; priceAtOrder: Prisma.Decimal }>;
  }> = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId, category: { shopId: shop.id } },
      include: { optionGroups: { include: { options: true } } },
    });

    if (!product) {
      return { error: { _form: [`Producto "${item.productName}" no encontrado`] } };
    }

    let itemTotal = product.basePrice;

    if (item.selections) {
      for (const [groupId, optionIds] of Object.entries(item.selections)) {
        const group = product.optionGroups.find((g) => g.id === groupId);
        if (!group) {
          return { error: { _form: [`Grupo "${groupId}" no válido para "${product.name}"`] } };
        }
        if (optionIds.length < group.minSelect || optionIds.length > group.maxSelect) {
          return { error: { _form: [`"${group.name}" requiere entre ${group.minSelect} y ${group.maxSelect} opciones`] } };
        }
        for (const optionId of optionIds) {
          const option = group.options.find((o) => o.id === optionId);
          if (!option || !option.isAvailable) {
            return { error: { _form: [`Opción "${optionId}" no disponible`] } };
          }
          itemTotal = itemTotal.plus(option.priceModifier);
        }
      }
    }

    const unitPrice = itemTotal;
    const totalPrice = unitPrice;

    subtotal = subtotal.plus(totalPrice);

    const selectedOptions: Array<{ optionId: string; priceAtOrder: Prisma.Decimal }> = [];
    if (item.selections) {
      for (const optionIds of Object.values(item.selections)) {
        for (const optionId of optionIds) {
          let price = new Prisma.Decimal(0);
          for (const group of product.optionGroups) {
            const opt = group.options.find((o) => o.id === optionId);
            if (opt) {
              price = opt.priceModifier;
              break;
            }
          }
          selectedOptions.push({ optionId, priceAtOrder: price });
        }
      }
    }

    orderItemsData.push({
      productId: item.productId,
      productName: item.productName,
      unitPrice,
      totalPrice,
      specialNotes: item.specialNotes,
      selectedOptions,
    });
  }

  const totalAmount = subtotal;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const successUrl = `${baseUrl}/${shop.slug}/checkout/success`;
  const failureUrl = `${baseUrl}/${shop.slug}/checkout?status=failure`;
  const pendingUrl = `${baseUrl}/${shop.slug}/checkout?status=pending`;

  const order = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        shopId: shop.id,
        customerId: userId ?? shop.ownerId,
        status: "PENDING",
        subtotal,
        totalAmount,
        notes: [
          `Tipo: ${parsed.deliveryType === "delivery" ? "Delivery" : "Para llevar"}`,
          `Fecha: ${parsed.scheduledDate} ${parsed.scheduledTime}`,
          `Cliente: ${parsed.customerName} | ${parsed.customerPhone}`,
          parsed.customerEmail ? `Email: ${parsed.customerEmail}` : null,
          parsed.address ? `Dirección: ${parsed.address}` : null,
          `Pago: ${parsed.paymentMethod === "cash" ? "Efectivo" : parsed.paymentMethod === "mercadopago" ? "MercadoPago" : "Transferencia"}`,
          parsed.notes ? `Nota: ${parsed.notes}` : null,
        ].filter(Boolean).join("\n"),
        items: {
          create: orderItemsData.map((oi) => ({
            productId: oi.productId,
            unitPrice: oi.unitPrice,
            totalPrice: oi.totalPrice,
            specialNotes: oi.specialNotes,
            selectedOptions: {
              create: oi.selectedOptions.map((so) => ({
                optionId: so.optionId,
                priceAtOrder: so.priceAtOrder,
              })),
            },
          })),
        },
      },
    });
  });

  // ── MercadoPago ──
  if (parsed.paymentMethod === "mercadopago") {
    if (!shop.mpAccessToken) {
      return { error: { _form: ["El local no tiene configurado MercadoPago"] } };
    }

    try {
      const mpClient = new MercadoPagoConfig({ accessToken: shop.mpAccessToken });
      const preferenceApi = new Preference(mpClient);

      const mpItems = orderItemsData.map((oi, index) => ({
        id: `item-${index}`,
        title: oi.productName,
        unit_price: Number(Number(oi.unitPrice).toFixed(2)),
        quantity: 1,
        currency_id: "ARS" as const,
      }));

      const preferenceBody = {
        items: mpItems,
        back_urls: {
          success: `${successUrl}?orderId=${order.id}&method=mercadopago`,
          failure: failureUrl,
          pending: pendingUrl,
        },
        external_reference: order.id,
        notification_url: `${baseUrl}/api/mp-webhook`,
        statement_descriptor: shop.name.slice(0, 22),
      };

      console.log("MP create body:", JSON.stringify(preferenceBody, null, 2));

      const preference = await preferenceApi.create({ body: preferenceBody });

      const paymentUrl = preference.init_point ?? preference.sandbox_init_point;
      if (!paymentUrl) {
        console.error("MP preference created but no init_point returned");
        return { error: { _form: ["No se pudo crear el link de pago"] } };
      }

      return { redirect: paymentUrl, mp: true };
    } catch (mpError) {
      console.error("MercadoPago preference creation failed:", mpError);
      return { error: { _form: ["Error al crear el pago. Intenta de nuevo."] } };
    }
  }

  return {
    redirect: `/checkout/success?orderId=${order.id}&method=${parsed.paymentMethod}`,
  };
}
