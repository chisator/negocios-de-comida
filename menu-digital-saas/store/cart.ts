"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  basePrice: number;
  selections: Record<string, string[]>;
  totalPrice: number;
  specialNotes?: string;
}

interface CartState {
  items: CartItem[];
  shopSlug: string | null;
  addItem: (item: CartItem, shopSlug: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shopSlug: null,

      addItem: (item, shopSlug) => {
        const current = get();
        if (current.shopSlug && current.shopSlug !== shopSlug) {
          if (!confirm("Cambiar de tienda vaciará tu carrito actual. ¿Continuar?")) return;
          set({ items: [], shopSlug: null });
        }
        set({
          items: [...current.items, item],
          shopSlug,
        });
      },

      removeItem: (id) => {
        const items = get().items.filter((i) => i.id !== id);
        set({
          items,
          shopSlug: items.length === 0 ? null : get().shopSlug,
        });
      },

      clearCart: () => set({ items: [], shopSlug: null }),

      totalAmount: () => get().items.reduce((sum, i) => sum + i.totalPrice, 0),
    }),
    { name: "menu-digital-cart" },
  ),
);
