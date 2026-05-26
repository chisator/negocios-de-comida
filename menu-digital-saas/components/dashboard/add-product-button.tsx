"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createProduct } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface AddProductButtonProps {
  shopId: string;
  shopSlug: string;
  categoryId: string;
}

export function AddProductButton({ shopId, categoryId }: AddProductButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.append("shopId", shopId);
    formData.append("categoryId", categoryId);
    const result = await createProduct(formData);
    if (result.error) {
      const msgs = Object.values(result.error).flat().join(", ");
      setError(msgs || "Error al crear el producto");
      setPending(false);
      return;
    }
    setOpen(false);
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#11BEE8] hover:text-[#0fa8d0] py-2"
      >
        <Plus className="w-3.5 h-3.5" />
        Agregar producto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900">Nuevo producto</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre</label>
                <input
                  name="name"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
                  placeholder="Ej: Hamburguesa Clásica"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8] resize-none"
                  placeholder="Descripción del producto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Precio base ($)
                </label>
                <input
                  name="basePrice"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
                  placeholder="22000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  URL de imagen
                </label>
                <input
                  name="imageUrl"
                  type="url"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
                  placeholder="https://..."
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#11BEE8] text-black text-sm font-semibold hover:bg-[#0fa8d0] disabled:opacity-50"
                >
                  {pending ? "Creando..." : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
