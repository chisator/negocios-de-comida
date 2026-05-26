import { prisma } from "@/lib/prisma";
import { MenuManager } from "@/components/dashboard/menu-manager";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;

  const shop = await prisma.shop.findUniqueOrThrow({
    where: { slug: shopSlug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            orderBy: { sortOrder: "asc" },
            include: {
              optionGroups: {
                include: { options: true },
              },
            },
          },
        },
      },
    },
  });

  return (
    <MenuManager
      shopId={shop.id}
      shopSlug={shopSlug}
      categories={JSON.parse(JSON.stringify(shop.categories))}
    />
  );
}
