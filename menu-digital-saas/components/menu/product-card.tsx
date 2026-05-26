import { Plus } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    basePrice: number;
  };
  onSelect: () => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button
      onClick={onSelect}
      className="flex gap-3 bg-zinc-900 rounded-2xl p-3 w-full text-left border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] transition-all duration-150"
    >
      <div className="w-24 h-24 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
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

      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-zinc-400 text-xs line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[#11BEE8] font-bold text-lg">
            ${product.basePrice.toFixed(2)}
          </span>
          <span className="w-8 h-8 rounded-full bg-[#11BEE8] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(17,190,232,0.4)]">
            <Plus className="w-4 h-4 text-black" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  );
}
