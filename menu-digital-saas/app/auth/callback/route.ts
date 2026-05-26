import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  await prisma.user.upsert({
    where: { id: data.user.id },
    update: {
      email: data.user.email ?? undefined,
      name: data.user.user_metadata.full_name ?? undefined,
      avatarUrl: data.user.user_metadata.avatar_url ?? undefined,
    },
    create: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata.full_name,
      avatarUrl: data.user.user_metadata.avatar_url,
    },
  });

  const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });

  if (dbUser?.role === "SHOP_OWNER" || dbUser?.role === "ADMIN") {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  try {
    const shop = await prisma.shop.findFirst({
      where: { ownerId: data.user.id },
    });
    if (shop) {
      return NextResponse.redirect(`${origin}/${shop.slug}`);
    }
  } catch {
    // no shop owned
  }

  return NextResponse.redirect(`${origin}${next}`);
}
