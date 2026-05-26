import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Menu, Bell, Search } from "lucide-react";

export default async function ShopDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;

  const supabaseUser = await getAuthenticatedUser();
  const dbUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } });

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug, ownerId: supabaseUser.id },
  });

  if (!shop) notFound();

  return (
    <div className="flex h-screen bg-zinc-50">
      <DashboardSidebar shopSlug={shop.slug} shopName={shop.name} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-zinc-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1 rounded-md hover:bg-zinc-100">
              <Menu className="w-5 h-5 text-zinc-600" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg text-sm text-zinc-500">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent outline-none w-40 text-zinc-700 placeholder:text-zinc-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-zinc-100 relative">
              <Bell className="w-5 h-5 text-zinc-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#11BEE8] flex items-center justify-center text-white text-xs font-bold">
              {dbUser?.name?.charAt(0) ?? "O"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
