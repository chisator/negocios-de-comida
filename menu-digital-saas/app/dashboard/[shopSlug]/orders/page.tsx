import { prisma } from "@/lib/prisma";
import { OrdersView } from "@/components/dashboard/orders-view";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;

  const shop = await prisma.shop.findUniqueOrThrow({
    where: { slug: shopSlug },
  });

  const orders = await prisma.order.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          selectedOptions: {
            include: { option: true },
          },
        },
      },
    },
  });

  return (
    <OrdersView
      shopSlug={shopSlug}
      orders={JSON.parse(JSON.stringify(orders))}
    />
  );
}
