import "server-only";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return user;
});

export const getPrismaUser = cache(async () => {
  const supabaseUser = await getAuthenticatedUser();
  return prisma.user.upsert({
    where: { id: supabaseUser.id },
    update: {
      email: supabaseUser.email ?? undefined,
      name: supabaseUser.user_metadata?.full_name ?? undefined,
      avatarUrl: supabaseUser.user_metadata?.avatar_url ?? undefined,
    },
    create: {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
    },
  });
});

export const getDashboardShop = cache(async () => {
  const dbUser = await getPrismaUser();

  if (dbUser.role === "SUPER_ADMIN") {
    const shop = await prisma.shop.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!shop) redirect("/");
    return { user: dbUser, shop };
  }

  if (dbUser.role !== "SHOP_OWNER" && dbUser.role !== "ADMIN") {
    redirect("/");
  }

  const shop = await prisma.shop.findFirst({
    where: { ownerId: dbUser.id },
    orderBy: { createdAt: "asc" },
  });

  if (!shop) redirect("/");

  return { user: dbUser, shop };
});

export const getSuperAdmin = cache(async () => {
  const dbUser = await getPrismaUser();
  if (dbUser.role !== "SUPER_ADMIN") redirect("/");
  return dbUser;
});

export async function getShopOwnerContext(shopId: string) {
  const supabaseUser = await getAuthenticatedUser();

  const dbUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
  if (dbUser?.role === "SUPER_ADMIN") {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error("Shop not found");
    return { user: supabaseUser, shop };
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId, ownerId: supabaseUser.id },
  });

  if (!shop) throw new Error("Forbidden: Not the shop owner");
  return { user: supabaseUser, shop };
}
