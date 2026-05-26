import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("Clearing existing data...");

  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.option.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating owner user...");
  const owner = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "owner@loft.com",
      name: "Dueño Loft",
      role: "SHOP_OWNER",
    },
  });

  console.log('Creating shop "Loft"...');
  const shop = await prisma.shop.create({
    data: {
      ownerId: owner.id,
      name: "Loft",
      slug: "loft",
      description: "Hamburguesas artesanales · Birra tirada · Buenas vibras",
      address: "Av. Corrientes 1234, CABA",
      isOpen: true,
    },
  });

  console.log('Creating category "Edición Aniversario"...');
  const category = await prisma.category.create({
    data: {
      shopId: shop.id,
      name: "Edición Aniversario",
      description: "Sabores que celebran nuestros 5 años",
      sortOrder: 0,
    },
  });

  console.log('Creating product "Hamburguesa Horus"...');
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: "Hamburguesa Horus",
      description:
        "Medallón de roast beef 120g, queso cheddar, panceta crocante, cebolla caramelizada y nuestra salsa secreta en pan brioche artesanal.",
      basePrice: 22000,
      sortOrder: 0,
    },
  });

  console.log('Creating option group "Guarnición"...');
  const guarnicion = await prisma.optionGroup.create({
    data: {
      productId: product.id,
      name: "Guarnición",
      description: "Elegí una guarnición para acompañar",
      minSelect: 1,
      maxSelect: 1,
      isRequired: true,
      sortOrder: 0,
    },
  });

  await prisma.option.createMany({
    data: [
      {
        optionGroupId: guarnicion.id,
        name: "Aros de cebolla",
        priceModifier: 5000,
        sortOrder: 0,
      },
      {
        optionGroupId: guarnicion.id,
        name: "Papas fritas",
        priceModifier: 0,
        isDefault: true,
        sortOrder: 1,
      },
    ],
  });

  console.log('Creating option group "Extra Salsa"...');
  const salsas = await prisma.optionGroup.create({
    data: {
      productId: product.id,
      name: "Extra Salsa",
      description: "Sumale el toque que quieras",
      minSelect: 0,
      maxSelect: 2,
      isRequired: false,
      sortOrder: 1,
    },
  });

  await prisma.option.createMany({
    data: [
      {
        optionGroupId: salsas.id,
        name: "Mayonesa de morrón",
        description: "Hecha en casa, ahumada",
        priceModifier: 500,
        sortOrder: 0,
      },
      {
        optionGroupId: salsas.id,
        name: "Salsa Big",
        description: "La clásica, la que va con todo",
        priceModifier: 500,
        sortOrder: 1,
      },
    ],
  });

  console.log("\nSeed complete!");
  console.log(`  Shop:  ${shop.name} (/${shop.slug})`);
  console.log(`  Category: ${category.name}`);
  console.log(`  Product: ${product.name} — $${Number(product.basePrice).toFixed(2)}`);
  console.log(`  Option Groups: ${guarnicion.name}, ${salsas.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
