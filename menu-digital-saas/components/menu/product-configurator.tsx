"use client";

import { X, Check } from "lucide-react";
import { useProductConfigurator } from "@/hooks/useProductConfigurator";
import { useCartStore } from "@/store/cart";

type Option = {
  id: string;
  name: string;
  description: string | null;
  priceModifier: number;
  isDefault: boolean;
  isAvailable: boolean;
};

type OptionGroup = {
  id: string;
  name: string;
  description: string | null;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: Option[];
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  optionGroups: OptionGroup[];
};

interface ProductConfiguratorProps {
  product: Product;
  shopSlug: string;
  onClose: () => void;
}

function formatPrice(price: number): string {
  return price >= 0 ? `+$${price.toFixed(2)}` : `-$${Math.abs(price).toFixed(2)}`;
}

export function ProductConfigurator({ product, shopSlug, onClose }: ProductConfiguratorProps) {
  const { selections, toggleOption, setOption, reset, computeTotalPrice, isValid } =
    useProductConfigurator();
  const addItem = useCartStore((s) => s.addItem);

  const hasOptions = product.optionGroups.length > 0;
  const totalPrice = hasOptions
    ? computeTotalPrice(
        product.basePrice,
        product.optionGroups.map((og) => ({
          id: og.id,
          minSelect: og.minSelect,
          maxSelect: og.maxSelect,
          isRequired: og.isRequired,
          options: og.options,
        })),
      )
    : product.basePrice;

  const valid = hasOptions
    ? isValid(
        product.optionGroups.map((og) => ({
          id: og.id,
          minSelect: og.minSelect,
          maxSelect: og.maxSelect,
          isRequired: og.isRequired,
          options: og.options,
        })),
      )
    : true;

  const handleAdd = () => {
    addItem(
      {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        basePrice: product.basePrice,
        selections,
        totalPrice,
      },
      shopSlug,
    );
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#111] rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-white font-bold text-lg">Personalizar</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="flex gap-3 px-4 py-3 border-b border-zinc-800">
          <div className="w-20 h-20 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                Sin imagen
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">{product.name}</h3>
            {product.description && (
              <p className="text-zinc-400 text-xs line-clamp-2 mt-1">
                {product.description}
              </p>
            )}
            <p className="text-[#11BEE8] font-bold mt-1">
              ${product.basePrice.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {product.optionGroups.map((group) => {
            const selectedCount = (selections[group.id] ?? []).length;
            const isSingle = group.maxSelect === 1 && group.minSelect <= 1;

            return (
              <div key={group.id}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-white font-semibold text-sm">
                      {group.name}
                      {group.isRequired && (
                        <span className="text-pink-500 ml-1">*</span>
                      )}
                    </h4>
                    {group.description && (
                      <p className="text-zinc-500 text-xs">{group.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {selectedCount}/{group.maxSelect}
                    {group.minSelect > 0 && ` · min ${group.minSelect}`}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.options.map((option) => {
                    const isSelected = (selections[group.id] ?? []).includes(option.id);

                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          isSingle
                            ? setOption(group.id, option.id)
                            : toggleOption(group.id, option.id, group.maxSelect)
                        }
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${
                          isSelected
                            ? "border-[#11BEE8] bg-[#11BEE8]/10"
                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#11BEE8] border-[#11BEE8]"
                              : "border-zinc-600"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 text-left min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {option.name}
                          </p>
                          {option.description && (
                            <p className="text-zinc-500 text-xs truncate">
                              {option.description}
                            </p>
                          )}
                        </div>

                        {option.priceModifier !== 0 && (
                          <span
                            className={`text-xs font-semibold shrink-0 ${
                              option.priceModifier > 0
                                ? "text-[#11BEE8]"
                                : "text-red-400"
                            }`}
                          >
                            {formatPrice(option.priceModifier)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-800 px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Total</span>
            <span className="text-[#11BEE8] font-bold text-xl">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!valid}
            className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200 ${
              valid
                ? "bg-[#11BEE8] text-black shadow-[0_0_20px_rgba(17,190,232,0.4)] active:scale-[0.98]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {valid ? `Agregar · $${totalPrice.toFixed(2)}` : "Completa las opciones"}
          </button>
        </div>
      </div>
    </div>
  );
}
