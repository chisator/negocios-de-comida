import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MenuView } from "@/components/menu/menu-view";

export const dynamic = "force-dynamic";

export default async function ShopMenuPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
            include: {
              optionGroups: {
                orderBy: { sortOrder: "asc" },
                include: {
                  options: {
                    where: { isAvailable: true },
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!shop) notFound();

  return <MenuView shop={JSON.parse(JSON.stringify(shop))} />;
}
