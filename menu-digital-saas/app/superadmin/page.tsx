import { prisma } from "@/lib/prisma";
import { getSuperAdmin } from "@/lib/auth";
import { SuperAdminView } from "@/components/dashboard/superadmin-view";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const admin = await getSuperAdmin();
  if (!admin) notFound();

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { id: true, email: true, name: true } } },
  });

  return (
    <SuperAdminView
      shops={JSON.parse(JSON.stringify(shops))}
      adminEmail={admin.email ?? admin.phone ?? "Admin"}
    />
  );
}
