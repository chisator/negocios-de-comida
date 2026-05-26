import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailView } from "@/components/dashboard/product-detail-view";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ shopSlug: string; productId: string }>;
}) {
  const { shopSlug, productId } = await params;

  const shop = await prisma.shop.findUniqueOrThrow({ where: { slug: shopSlug } });

  const product = await prisma.product.findUnique({
    where: { id: productId, category: { shopId: shop.id } },
    include: {
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!product) notFound();

  return (
    <ProductDetailView
      product={JSON.parse(JSON.stringify(product))}
      shopSlug={shopSlug}
    />
  );
}
