import { prisma } from "@/lib/prisma";
import { SettingsView } from "@/components/dashboard/settings-view";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;

  const shop = await prisma.shop.findUniqueOrThrow({
    where: { slug: shopSlug },
  });

  return (
    <SettingsView
      shop={JSON.parse(JSON.stringify(shop))}
    />
  );
}
