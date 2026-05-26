"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createCategory } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface AddCategoryButtonProps {
  shopId: string;
  shopSlug: string;
}

export function AddCategoryButton({ shopId }: AddCategoryButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.append("shopId", shopId);
    const result = await createCategory(formData);
    if (result.error) {
      const msgs = Object.values(result.error).flat().join(", ");
      setError(msgs || "Error al crear la categoría");
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
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#11BEE8] text-black text-sm font-semibold hover:bg-[#0fa8d0] transition-colors shadow-[0_0_12px_rgba(17,190,232,0.3)]"
      >
        <Plus className="w-4 h-4" />
        Agregar categoría
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900">Nueva categoría</h2>
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
                  placeholder="Ej: Hamburguesas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
                <input
                  name="description"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
                  placeholder="Opcional"
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
                  {pending ? "Creando..." : "Crear categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
