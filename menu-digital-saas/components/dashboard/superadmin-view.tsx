"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Store } from "lucide-react";
import { toggleShop } from "@/app/actions/superadmin";

type ShopData = {
  id: string;
  name: string;
  slug: string;
  isOpen: boolean;
  createdAt: string;
  mpAccessToken: string | null;
  owner: { id: string; email: string | null; name: string | null } | null;
};

interface SuperAdminViewProps {
  shops: ShopData[];
  adminEmail: string;
}

export function SuperAdminView({ shops, adminEmail }: SuperAdminViewProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function handleToggle(shop: ShopData) {
    setPending(shop.id);
    const form = new FormData();
    form.append("id", shop.id);
    form.append("isOpen", String(shop.isOpen));
    await toggleShop(form);
    setPending(null);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#11BEE8]" />
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Super Admin</h1>
            <p className="text-xs text-zinc-500">{adminEmail}</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#11BEE8]/10 text-[#11BEE8] text-xs font-bold">
          SUPER_ADMIN
        </span>
      </header>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Tiendas</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {shops.length} tienda{shops.length !== 1 ? "s" : ""} registrada{shops.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-4">Tienda</div>
            <div className="col-span-3">Dueño</div>
            <div className="col-span-2">MP Config</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1" />
          </div>

          <div className="divide-y divide-zinc-100">
            {shops.map((shop) => (
              <div key={shop.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center text-sm">
                <div className="col-span-4">
                  <p className="font-semibold text-zinc-900">{shop.name}</p>
                  <p className="text-xs text-zinc-400">/{shop.slug}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-zinc-700 truncate">{shop.owner?.email ?? shop.owner?.name ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  {shop.mpAccessToken ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                      <Store className="w-3 h-3" /> Conectado
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">Sin configurar</span>
                  )}
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleToggle(shop)}
                    disabled={pending === shop.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      shop.isOpen
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {shop.isOpen ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    {shop.isOpen ? "Activo" : "Pausado"}
                  </button>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-xs text-zinc-400">
                    {new Date(shop.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
              </div>
            ))}

            {shops.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-zinc-400 text-sm">No hay tiendas registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
