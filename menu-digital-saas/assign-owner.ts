import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
});

async function main() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  console.log(`Found ${users.length} user(s):`);
  users.forEach((u) => console.log(`  ${u.id} | ${u.email ?? u.phone} | ${u.role}`));

  const realUser = users[0];
  if (!realUser) throw new Error("No users found");

  const shop = await prisma.shop.findUnique({ where: { slug: "loft" } });
  if (!shop) throw new Error('Shop "loft" not found');

  await prisma.shop.update({
    where: { id: shop.id },
    data: { ownerId: realUser.id },
  });

  await prisma.user.update({
    where: { id: realUser.id },
    data: { role: "SHOP_OWNER" },
  });

  console.log(`\nOwner transferred to ${realUser.email}`);
  console.log(`  Shop: ${shop.name} (/${shop.slug})`);
  console.log(`  Role: SHOP_OWNER`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
