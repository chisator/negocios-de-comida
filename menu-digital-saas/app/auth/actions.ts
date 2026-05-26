"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "No se pudo iniciar sesión con Google" };
}

export async function signInWithPhone(phone: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
      channel: "sms",
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Código inválido" };
  }

  await prisma.user.upsert({
    where: { id: data.user.id },
    update: {
      phone: data.user.phone ?? undefined,
    },
    create: {
      id: data.user.id,
      phone: data.user.phone,
      name: data.user.user_metadata?.name,
    },
  });

  const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });

  if (dbUser?.role === "SHOP_OWNER" || dbUser?.role === "ADMIN") {
    redirect("/dashboard");
  }

  try {
    const shop = await prisma.shop.findFirst({
      where: { ownerId: data.user.id },
    });
    if (shop) {
      redirect(`/${shop.slug}`);
    }
  } catch {
    // no shop owned
  }

  redirect("/");
}
