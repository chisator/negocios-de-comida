"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, EyeOff, Settings } from "lucide-react";
import { updateCategory, deleteCategory, toggleCategory, updateProduct, deleteProduct, toggleProduct } from "@/app/actions/admin";
import { AddCategoryButton } from "./add-category-button";
import { AddProductButton } from "./add-product-button";

type OptionData = { id: string; name: string; priceModifier: { toString(): string } };

type OptionGroupData = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: OptionData[];
};

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: { toString(): string };
  isAvailable: boolean;
  optionGroups: OptionGroupData[];
};

type CategoryData = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  products: ProductData[];
};

interface MenuManagerProps {
  shopId: string;
  shopSlug: string;
  categories: CategoryData[];
}

function fmt(n: { toString(): string }) {
  return Number(n.toString()).toFixed(2);
}

export function MenuManager({ shopId, shopSlug, categories }: MenuManagerProps) {
  const router = useRouter();

  // Edit states
  const [editCategory, setEditCategory] = useState<CategoryData | null>(null);
  const [editProduct, setEditProduct] = useState<ProductData | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "product"; id: string; name: string } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);

  // ── Toggle ──

  async function handleToggle(type: "category" | "product", id: string, current: boolean) {
    setPending(id);
    const form = new FormData();
    form.append("id", id);
    form.append("shopId", shopId);
    form.append(type === "category" ? "isActive" : "isAvailable", String(current));
    const fn = type === "category" ? toggleCategory : toggleProduct;
    await fn(form);
    setPending(null);
    router.refresh();
  }

  // ── Edit ──

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, type: "category" | "product") {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.append("shopId", shopId);
    form.append("id", type === "category" ? editCategory!.id : editProduct!.id);
    setPending(type);
    const result = await (type === "category" ? updateCategory : updateProduct)(form);
    if (result?.error) {
      setErrors(Object.fromEntries(Object.entries(result.error).map(([k, v]) => [k, (v as string[]).join(", ")])));
      setPending(null);
      return;
    }
    setEditCategory(null);
    setEditProduct(null);
    setErrors({});
    setPending(null);
    router.refresh();
  }

  // ── Delete ──

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(deleteTarget.id);
    const form = new FormData();
    form.append("id", deleteTarget.id);
    form.append("shopId", shopId);
    const fn = deleteTarget.type === "category" ? deleteCategory : deleteProduct;
    await fn(form);
    setDeleteTarget(null);
    setPending(null);
    router.refresh();
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Menú</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestioná tus categorías y productos</p>
        </div>
        <AddCategoryButton shopId={shopId} shopSlug={shopSlug} />
      </div>

      {categories.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-12 text-center">
          <UtensilsCrossedIcon className="mx-auto text-zinc-300 mb-3" />
          <p className="text-zinc-500 font-medium">No hay categorías aún</p>
          <p className="text-sm text-zinc-400 mt-1">Creá tu primera categoría para empezar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className={`bg-white border rounded-xl overflow-hidden transition-opacity ${cat.isActive ? "border-zinc-200" : "border-zinc-200 opacity-60"}`}>
              <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle("category", cat.id, cat.isActive)}
                    disabled={pending === cat.id}
                    className="shrink-0"
                  >
                    {cat.isActive ? (
                      <Eye className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-sm">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-zinc-500 mt-0.5">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{cat.products.length} productos</span>
                  <button
                    onClick={() => setEditCategory(cat)}
                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: "category", id: cat.id, name: cat.name })}
                    className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {cat.products.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-zinc-400">Sin productos en esta categoría</p>
                  <AddProductButton shopId={shopId} shopSlug={shopSlug} categoryId={cat.id} />
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {cat.products.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle("product", prod.id, prod.isAvailable)}
                            disabled={pending === prod.id}
                            className="shrink-0"
                          >
                            {prod.isAvailable ? (
                              <Eye className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-zinc-400" />
                            )}
                          </button>
                          <p className="font-medium text-sm text-zinc-900 truncate">{prod.name}</p>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 ml-6 truncate">
                          {prod.optionGroups.length} grupos de opciones
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-semibold text-[#11BEE8]">${fmt(prod.basePrice)}</span>
                        <Link
                          href={`/dashboard/${shopSlug}/menu/product/${prod.id}`}
                          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-[#11BEE8]"
                          title="Gestionar opciones"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setEditProduct({ ...prod, basePrice: prod.basePrice })}
                          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: "product", id: prod.id, name: prod.name })}
                          className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="px-5 py-2">
                    <AddProductButton shopId={shopId} shopSlug={shopSlug} categoryId={cat.id} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Category Modal */}
      {editCategory && (
        <Modal onClose={() => { setEditCategory(null); setErrors({}); }}>
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Editar categoría</h2>
          <form onSubmit={(e) => handleUpdate(e, "category")} className="space-y-4">
            <Input label="Nombre" name="name" defaultValue={editCategory.name} error={errors.name} />
            <Input label="Descripción" name="description" defaultValue={editCategory.description ?? ""} />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditCategory(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
              <button type="submit" disabled={pending === "category"} className="flex-1 py-2.5 rounded-xl bg-[#11BEE8] text-black text-sm font-semibold disabled:opacity-50">
                {pending === "category" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <Modal onClose={() => { setEditProduct(null); setErrors({}); }}>
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Editar producto</h2>
          <form onSubmit={(e) => handleUpdate(e, "product")} className="space-y-4">
            <Input label="Nombre" name="name" defaultValue={editProduct.name} error={errors.name} />
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
              <textarea name="description" rows={2} defaultValue={editProduct.description ?? ""} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]" />
            </div>
            <Input label="Precio base ($)" name="basePrice" type="number" defaultValue={fmt(editProduct.basePrice)} error={errors.basePrice} />
            <Input label="URL de imagen" name="imageUrl" type="url" defaultValue={editProduct.imageUrl ?? ""} />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditProduct(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
              <button type="submit" disabled={pending === "product"} className="flex-1 py-2.5 rounded-xl bg-[#11BEE8] text-black text-sm font-semibold disabled:opacity-50">
                {pending === "product" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-1">¿Eliminar {deleteTarget.type === "category" ? "categoría" : "producto"}?</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Se eliminará permanentemente <strong>{deleteTarget.name}</strong> y todos sus datos asociados.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
              <button onClick={handleDelete} disabled={pending === deleteTarget.id} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                {pending === deleteTarget.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl p-6">{children}</div>
    </div>
  );
}

function Input({ label, name, type = "text", defaultValue = "", error }: { label: string; name: string; type?: string; defaultValue?: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8] ${error ? "border-red-400" : "border-zinc-300"}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function UtensilsCrossedIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}
