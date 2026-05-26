import { ChefHat } from "lucide-react";

interface ShopHeaderProps {
  shop: {
    name: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    address: string | null;
    isOpen: boolean;
  };
}

export function ShopHeader({ shop }: ShopHeaderProps) {
  return (
    <div className="relative">
      {shop.bannerUrl ? (
        <div className="h-36 w-full overflow-hidden">
          <img
            src={shop.bannerUrl}
            alt={shop.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        </div>
      ) : (
        <div className="h-36 w-full bg-gradient-to-br from-[#11BEE8]/20 to-pink-500/20" />
      )}

      <div className="px-4 pb-4 -mt-10 relative z-10">
        <div className="flex items-end gap-3">
          <div className="w-16 h-16 rounded-xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ChefHat className="w-8 h-8 text-[#11BEE8]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-xl font-bold leading-tight truncate">
              {shop.name}
            </h1>
            {shop.description && (
              <p className="text-zinc-400 text-sm line-clamp-2 mt-0.5">
                {shop.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                shop.isOpen ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-zinc-400 font-medium">
              {shop.isOpen ? "Abierto" : "Cerrado"}
            </span>
          </div>
        </div>

        {shop.address && (
          <p className="text-zinc-500 text-xs mt-2 pl-[4.75rem]">
            {shop.address}
          </p>
        )}
      </div>
    </div>
  );
}
