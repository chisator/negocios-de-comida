"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { ShopHeader } from "./shop-header";
import { CategoryNav } from "./category-nav";
import { ProductCard } from "./product-card";
import { ProductConfigurator } from "./product-configurator";
import { useCartStore } from "@/store/cart";

type Option = {
  id: string;
  name: string;
  description: string | null;
  priceModifier: { toString(): string };
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
};

type OptionGroup = {
  id: string;
  name: string;
  description: string | null;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  sortOrder: number;
  options: Option[];
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: { toString(): string };
  isAvailable: boolean;
  sortOrder: number;
  optionGroups: OptionGroup[];
};

type Category = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  products: Product[];
};

type Shop = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  phone: string | null;
  isOpen: boolean;
  slug: string;
  categories: Category[];
};

function parsePrice(price: { toString(): string }): number {
  return Number(price.toString());
}

interface MenuViewProps {
  shop: Shop;
}

export function MenuView({ shop }: MenuViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    shop.categories[0]?.id ?? "",
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const cartItems = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.totalAmount)();

  const activeProducts =
    shop.categories.find((c) => c.id === activeCategory)?.products ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <ShopHeader shop={shop} />

      <CategoryNav
        categories={shop.categories}
        activeId={activeCategory}
        onChange={setActiveCategory}
      />

      <div className="flex-1 px-4 pb-24 pt-4">
        {activeProducts.length === 0 ? (
          <p className="text-center text-zinc-500 mt-20 text-sm">
            No hay productos en esta categoria
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  basePrice: parsePrice(product.basePrice),
                }}
                onSelect={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-zinc-800">
          <Link
            href={`/${shop.slug}/checkout`}
            className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#11BEE8] text-black font-bold shadow-[0_0_20px_rgba(17,190,232,0.5)] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
            </div>
            <span>Ver carrito · ${cartTotal.toFixed(2)}</span>
          </Link>
        </div>
      )}

      {selectedProduct && (
        <ProductConfigurator
          shopSlug={shop.slug}
          product={{
            ...selectedProduct,
            basePrice: parsePrice(selectedProduct.basePrice),
            optionGroups: selectedProduct.optionGroups.map((og) => ({
              ...og,
              options: og.options
                .filter((o) => o.isAvailable)
                .map((o) => ({
                  ...o,
                  priceModifier: parsePrice(o.priceModifier),
                })),
            })),
          }}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
