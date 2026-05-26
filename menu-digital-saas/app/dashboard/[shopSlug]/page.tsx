import { prisma } from "@/lib/prisma";
import { TrendingUp, ShoppingBag, UtensilsCrossed, DollarSign } from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;

  const shop = await prisma.shop.findUniqueOrThrow({
    where: { slug: shopSlug },
    include: {
      _count: { select: { categories: true, orders: true } },
    },
  });

  const productCount = await prisma.product.count({
    where: { category: { shop: { slug: shopSlug } } },
  });

  const stats = [
    {
      label: "Productos",
      value: productCount,
      icon: UtensilsCrossed,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Categorías",
      value: shop._count.categories,
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Pedidos",
      value: shop._count.orders,
      icon: ShoppingBag,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Ingresos",
      value: "$0",
      icon: DollarSign,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Panel</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Bienvenido a {shop.name}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-zinc-200 rounded-xl p-4"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color} mb-3`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Actividad reciente</h2>
        <p className="text-sm text-zinc-400">
          No hay actividad para mostrar aún. Empezá agregando productos a tu menú.
        </p>
      </div>
    </div>
  );
}
