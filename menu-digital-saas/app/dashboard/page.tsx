import { getDashboardShop } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { shop } = await getDashboardShop();
  redirect(`/dashboard/${shop.slug}`);
}
