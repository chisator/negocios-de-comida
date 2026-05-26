"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Toggle Shop ──

export async function toggleShop(formData: FormData) {
  await getSuperAdmin();
  const id = formData.get("id") as string;
  const isOpen = formData.get("isOpen") === "true";
  await prisma.shop.update({ where: { id }, data: { isOpen: !isOpen } });
  revalidatePath("/superadmin");
  return { success: true };
}

// ── Save MercadoPago Credentials ──

const MpCredentialsSchema = z.object({
  shopId: z.string().uuid(),
  mpAccessToken: z.string().min(1, "El token es obligatorio"),
  mpPublicKey: z.string().min(1, "La clave pública es obligatoria"),
});

export async function saveMpCredentials(formData: FormData) {
  const parsed = MpCredentialsSchema.safeParse({
    shopId: formData.get("shopId"),
    mpAccessToken: formData.get("mpAccessToken"),
    mpPublicKey: formData.get("mpPublicKey"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { shopId, mpAccessToken, mpPublicKey } = parsed.data;

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) return { error: { _form: ["Tienda no encontrada"] } };

  await prisma.shop.update({
    where: { id: shopId },
    data: { mpAccessToken, mpPublicKey },
  });

  revalidatePath(`/dashboard/${shop.slug}/settings`);
  return { success: true };
}
