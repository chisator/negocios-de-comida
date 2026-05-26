"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyShopOwnership(shopId: string) {
  const user = await getAuthenticatedUser();
  return prisma.shop.findUnique({ where: { id: shopId, ownerId: user.id } });
}

// ── Category CRUD ──

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
});

export async function createCategory(formData: FormData) {
  const shopId = formData.get("shopId") as string;
  const shop = await verifyShopOwnership(shopId);
  if (!shop) return { error: { _form: ["No autorizado"] } };

  const parsed = CategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const maxOrder = await prisma.category.aggregate({ where: { shopId }, _max: { sortOrder: true } });
  await prisma.category.create({
    data: { shopId, name: parsed.data.name, description: parsed.data.description ?? null, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  });
  revalidatePath(`/dashboard/${shop.slug}/menu`);
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const id = formData.get("id") as string;
  const shopId = formData.get("shopId") as string;
  const shop = await verifyShopOwnership(shopId);
  if (!shop) return { error: { _form: ["No autorizado"] } };

  const parsed = CategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.category.update({
    where: { id, shopId },
    data: { name: parsed.data.name, description: parsed.data.description ?? null },
  });
  revalidatePath(`/dashboard/${shop.slug}/menu`);
  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get("id") as string;
  const shopId = formData.get("shopId") as string;
  const shop = await verifyShopOwnership(shopId);
  if (!shop) return { error: { _form: ["No autorizado"] } };

  await prisma.category.delete({ where: { id, shopId } });
  revalidatePath(`/dashboard/${shop.slug}/menu`);
  return { success: true };
}

export async function toggleCategory(formData: FormData) {
  const id = formData.get("id") as string;
  const shopId = formData.get("shopId") as string;
  const isActive = formData.get("isActive") === "true";
  const shop = await verifyShopOwnership(shopId);
  if (!shop) return { error: { _form: ["No autorizado"] } };

  await prisma.category.update({ where: { id, shopId }, data: { isActive: !isActive } });
  revalidatePath(`/dashboard/${shop.slug}/menu`);
  return { success: true };
}

// ── Product CRUD ──

const ProductSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  basePrice: z.coerce.number().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function createProduct(formData: FormData) {
  const shopId = formData.get("shopId") as string;
  const categoryId = formData.get("categoryId") as string;
  const shop = await verifyShopOwnership(shopId);
  if (!shop) return { error: { _form: ["No autorizado"] } };

  const category = await prisma.category.findUnique({ where: { id: categoryId, shopId } });
  if (!category) return { error: { _form: ["Categoría no encontrada"] } };

  const parsed = ProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    basePrice: formData.get("basePrice"),
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const maxOrder = await prisma.product.aggregate({ where: { categoryId }, _max: { sortOrder: true } });
  await prisma.product.create({
    data: { categoryId, name: parsed.data.name, description: parsed.data.description ?? null, basePrice: parsed.data.basePrice, imageUrl: parsed.data.imageUrl || null, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  });
  revalidatePath(`/dashboard/${shop.slug}/menu`);
  return { success: true };
}

export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const shopId = formData.get("shopId") as string;
  const shop = await verifyShopOwnership(shopId);
  if (!shop) return { error: { _form: ["No autorizado"] } };

  const parsed = ProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    basePrice: formData.get("basePrice"),
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.product.update({
    where: { id, category: { shopId } },
    data: { name: parsed.data.name, description: parsed.data.description ?? null, basePrice: parsed.data.basePrice, imageUrl: parsed.data.imageUrl || null },
  });
  revalidatePath(`/dashboard/${shop.slug}/menu`);
  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const shopId = formData.get("shopId") as string;
  const shop = await verifyShopOwnership(shopId);
  if (!shop) return { error: { _form: ["No autorizado"] } };

  await prisma.product.delete({ where: { id, category: { shopId } } });
  revalidatePath(`/dashboard/${shop.slug}/menu`);
  return { success: true };
}

export async function toggleProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const shopId = formData.get("shopId") as string;
  const isAvailable = formData.get("isAvailable") === "true";
  const shop = await verifyShopOwnership(shopId);
  if (!shop) return { error: { _form: ["No autorizado"] } };

  await prisma.product.update({ where: { id, category: { shopId } }, data: { isAvailable: !isAvailable } });
  revalidatePath(`/dashboard/${shop.slug}/menu`);
  return { success: true };
}

// ── Option Group CRUD ──

const OptionGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  minSelect: z.coerce.number().int().min(0).max(20),
  maxSelect: z.coerce.number().int().min(1).max(20),
  isRequired: z.coerce.boolean().optional(),
});

async function verifyProductAccess(productId: string) {
  const user = await getAuthenticatedUser();
  return prisma.product.findUnique({
    where: { id: productId, category: { shop: { ownerId: user.id } } },
    include: { category: { select: { shop: { select: { slug: true } } } } },
  });
}

export async function createOptionGroup(formData: FormData) {
  const productId = formData.get("productId") as string;
  const product = await verifyProductAccess(productId);
  if (!product) return { error: { _form: ["No autorizado"] } };

  const parsed = OptionGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    minSelect: formData.get("minSelect"),
    maxSelect: formData.get("maxSelect"),
    isRequired: formData.get("isRequired") === "true",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const maxOrder = await prisma.optionGroup.aggregate({ where: { productId }, _max: { sortOrder: true } });
  const group = await prisma.optionGroup.create({
    data: { productId, name: parsed.data.name, description: parsed.data.description ?? null, minSelect: parsed.data.minSelect, maxSelect: parsed.data.maxSelect, isRequired: parsed.data.isRequired ?? false, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  });

  revalidatePath(`/dashboard/${product.category.shop.slug}/menu/product/${productId}`);
  return { success: true, id: group.id };
}

export async function updateOptionGroup(formData: FormData) {
  const id = formData.get("id") as string;
  const productId = formData.get("productId") as string;
  const product = await verifyProductAccess(productId);
  if (!product) return { error: { _form: ["No autorizado"] } };

  const parsed = OptionGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    minSelect: formData.get("minSelect"),
    maxSelect: formData.get("maxSelect"),
    isRequired: formData.get("isRequired") === "true",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.optionGroup.update({
    where: { id, productId },
    data: { name: parsed.data.name, description: parsed.data.description ?? null, minSelect: parsed.data.minSelect, maxSelect: parsed.data.maxSelect, isRequired: parsed.data.isRequired ?? false },
  });

  revalidatePath(`/dashboard/${product.category.shop.slug}/menu/product/${productId}`);
  return { success: true };
}

export async function deleteOptionGroup(formData: FormData) {
  const id = formData.get("id") as string;
  const productId = formData.get("productId") as string;
  const product = await verifyProductAccess(productId);
  if (!product) return { error: { _form: ["No autorizado"] } };

  await prisma.optionGroup.delete({ where: { id, productId } });

  revalidatePath(`/dashboard/${product.category.shop.slug}/menu/product/${productId}`);
  return { success: true };
}

// ── Option CRUD ──

const OptionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  priceModifier: z.coerce.number(),
});

export async function createOption(formData: FormData) {
  const optionGroupId = formData.get("optionGroupId") as string;
  const productId = formData.get("productId") as string;
  const product = await verifyProductAccess(productId);
  if (!product) return { error: { _form: ["No autorizado"] } };

  const group = await prisma.optionGroup.findUnique({ where: { id: optionGroupId, productId } });
  if (!group) return { error: { _form: ["Grupo no encontrado"] } };

  const parsed = OptionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceModifier: formData.get("priceModifier"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const maxOrder = await prisma.option.aggregate({ where: { optionGroupId }, _max: { sortOrder: true } });
  await prisma.option.create({
    data: { optionGroupId, name: parsed.data.name, description: parsed.data.description ?? null, priceModifier: parsed.data.priceModifier, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  });

  revalidatePath(`/dashboard/${product.category.shop.slug}/menu/product/${productId}`);
  return { success: true };
}

export async function updateOption(formData: FormData) {
  const id = formData.get("id") as string;
  const optionGroupId = formData.get("optionGroupId") as string;
  const productId = formData.get("productId") as string;
  const product = await verifyProductAccess(productId);
  if (!product) return { error: { _form: ["No autorizado"] } };

  const group = await prisma.optionGroup.findUnique({ where: { id: optionGroupId, productId } });
  if (!group) return { error: { _form: ["Grupo no encontrado"] } };

  const parsed = OptionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceModifier: formData.get("priceModifier"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.option.update({
    where: { id, optionGroupId },
    data: { name: parsed.data.name, description: parsed.data.description ?? null, priceModifier: parsed.data.priceModifier },
  });

  revalidatePath(`/dashboard/${product.category.shop.slug}/menu/product/${productId}`);
  return { success: true };
}

export async function deleteOption(formData: FormData) {
  const id = formData.get("id") as string;
  const optionGroupId = formData.get("optionGroupId") as string;
  const productId = formData.get("productId") as string;
  const product = await verifyProductAccess(productId);
  if (!product) return { error: { _form: ["No autorizado"] } };

  await prisma.option.delete({ where: { id, optionGroupId } });

  revalidatePath(`/dashboard/${product.category.shop.slug}/menu/product/${productId}`);
  return { success: true };
}

export async function toggleOption(formData: FormData) {
  const id = formData.get("id") as string;
  const optionGroupId = formData.get("optionGroupId") as string;
  const productId = formData.get("productId") as string;
  const isAvailable = formData.get("isAvailable") === "true";
  const product = await verifyProductAccess(productId);
  if (!product) return { error: { _form: ["No autorizado"] } };

  await prisma.option.update({ where: { id, optionGroupId }, data: { isAvailable: !isAvailable } });

  revalidatePath(`/dashboard/${product.category.shop.slug}/menu/product/${productId}`);
  return { success: true };
}

// ── Order Status ──

export async function updateOrderStatus(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const shopSlug = formData.get("shopSlug") as string;
  const status = formData.get("status") as string;

  const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { error: { _form: ["Estado inválido"] } };
  }

  const user = await getAuthenticatedUser();

  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return { error: { _form: ["Tienda no encontrada"] } };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.role !== "SUPER_ADMIN" && shop.ownerId !== user.id) {
    return { error: { _form: ["No autorizado"] } };
  }

  await prisma.order.update({
    where: { id: orderId, shopId: shop.id },
    data: { status: status as "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" },
  });

  revalidatePath(`/dashboard/${shopSlug}/orders`);
  return { success: true };
}
