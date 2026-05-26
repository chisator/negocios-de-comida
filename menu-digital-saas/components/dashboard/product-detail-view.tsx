"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import {
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOption,
  updateOption,
  deleteOption,
  toggleOption,
} from "@/app/actions/admin";

type Option = {
  id: string;
  name: string;
  description: string | null;
  priceModifier: { toString(): string };
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
  basePrice: { toString(): string };
  imageUrl: string | null;
  optionGroups: OptionGroup[];
};

function fmt(n: { toString(): string }) {
  return Number(n.toString()).toFixed(2);
}

interface ProductDetailViewProps {
  product: Product;
  shopSlug: string;
}

export function ProductDetailView({ product, shopSlug }: ProductDetailViewProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  // Group edit state
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);

  // Option edit state
  const [editingOption, setEditingOption] = useState<{ option: Option; groupId: string } | null>(null);
  const [showOptionForm, setShowOptionForm] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ type: "group" | "option"; id: string; name: string; groupId?: string } | null>(null);

  // Group form
  async function handleGroupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.append("productId", product.id);
    if (editingGroup) form.append("id", editingGroup.id);
    setPending("group");
    const result = await (editingGroup ? updateOptionGroup : createOptionGroup)(form);
    if (result?.error) { setPending(null); return; }
    setEditingGroup(null);
    setShowGroupForm(false);
    setPending(null);
    router.refresh();
  }

  // Option form
  async function handleOptionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.append("productId", product.id);
    form.append("optionGroupId", editingOption ? editingOption.groupId : showOptionForm!);
    if (editingOption) form.append("id", editingOption.option.id);
    setPending("option");
    const result = await (editingOption ? updateOption : createOption)(form);
    if (result?.error) { setPending(null); return; }
    setEditingOption(null);
    setShowOptionForm(null);
    setPending(null);
    router.refresh();
  }

  // Delete
  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(deleteTarget.id);
    const form = new FormData();
    form.append("id", deleteTarget.id);
    form.append("productId", product.id);
    if (deleteTarget.groupId) form.append("optionGroupId", deleteTarget.groupId);
    const fn = deleteTarget.type === "group" ? deleteOptionGroup : deleteOption;
    await fn(form);
    setDeleteTarget(null);
    setPending(null);
    router.refresh();
  }

  // Toggle option
  async function handleToggleOption(option: Option, groupId: string) {
    setPending(option.id);
    const form = new FormData();
    form.append("id", option.id);
    form.append("optionGroupId", groupId);
    form.append("productId", product.id);
    form.append("isAvailable", String(option.isAvailable));
    await toggleOption(form);
    setPending(null);
    router.refresh();
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/${shopSlug}/menu`}
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{product.name}</h1>
          <p className="text-sm text-zinc-500">
            ${fmt(product.basePrice)} · Variables del producto
          </p>
        </div>
      </div>

      {/* Option Groups */}
      <div className="space-y-4">
        {product.optionGroups.map((group) => (
          <div key={group.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-200">
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">{group.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {group.minSelect === group.maxSelect
                    ? `Elegir ${group.minSelect}`
                    : `Mín ${group.minSelect} · Máx ${group.maxSelect}`}
                  {group.isRequired && " · Obligatorio"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingGroup(group);
                    setShowGroupForm(true);
                  }}
                  className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ type: "group", id: group.id, name: group.name })}
                  className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {group.options.length === 0 ? (
                <div className="px-5 py-4 text-center">
                  <p className="text-sm text-zinc-400">Sin opciones</p>
                </div>
              ) : (
                group.options.map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleOption(opt, group.id)}
                        disabled={pending === opt.id}
                        className="shrink-0"
                      >
                        {opt.isAvailable ? (
                          <Eye className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{opt.name}</p>
                        {opt.description && (
                          <p className="text-xs text-zinc-500 truncate">{opt.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${Number(opt.priceModifier) >= 0 ? "text-[#11BEE8]" : "text-red-400"}`}>
                        {Number(opt.priceModifier) >= 0 ? "+" : "-"}${Math.abs(Number(fmt(opt.priceModifier)))}
                      </span>
                      <button
                        onClick={() => setEditingOption({ option: opt, groupId: group.id })}
                        className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: "option", id: opt.id, name: opt.name, groupId: group.id })}
                        className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              <div className="px-5 py-2">
                <button
                  onClick={() => setShowOptionForm(group.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#11BEE8] hover:text-[#0fa8d0] py-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar opción
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add group button */}
        <button
          onClick={() => {
            setEditingGroup(null);
            setShowGroupForm(true);
          }}
          className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-500 hover:border-[#11BEE8] hover:text-[#11BEE8] transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-1" /> Agregar grupo de opciones
        </button>
      </div>

      {/* Group Form Modal */}
      {(showGroupForm || editingGroup) && (
        <Modal onClose={() => { setShowGroupForm(false); setEditingGroup(null); }}>
          <h2 className="text-lg font-bold text-zinc-900 mb-4">
            {editingGroup ? "Editar grupo" : "Nuevo grupo de opciones"}
          </h2>
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <Input label="Nombre" name="name" defaultValue={editingGroup?.name ?? ""} />
            <Input label="Descripción" name="description" defaultValue={editingGroup?.description ?? ""} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Mínimo" name="minSelect" type="number" defaultValue={String(editingGroup?.minSelect ?? 0)} />
              <Input label="Máximo" name="maxSelect" type="number" defaultValue={String(editingGroup?.maxSelect ?? 1)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                name="isRequired"
                type="checkbox"
                value="true"
                defaultChecked={editingGroup?.isRequired ?? false}
                className="rounded border-zinc-300 text-[#11BEE8] focus:ring-[#11BEE8]"
              />
              Obligatorio
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setShowGroupForm(false); setEditingGroup(null); }} className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
              <button type="submit" disabled={pending === "group"} className="flex-1 py-2.5 rounded-xl bg-[#11BEE8] text-black text-sm font-semibold disabled:opacity-50">
                {pending === "group" ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Option Form Modal */}
      {(showOptionForm || editingOption) && (
        <Modal onClose={() => { setShowOptionForm(null); setEditingOption(null); }}>
          <h2 className="text-lg font-bold text-zinc-900 mb-4">
            {editingOption ? "Editar opción" : "Nueva opción"}
          </h2>
          <form onSubmit={handleOptionSubmit} className="space-y-4">
            <Input label="Nombre" name="name" defaultValue={editingOption?.option.name ?? ""} />
            <Input label="Descripción" name="description" defaultValue={editingOption?.option.description ?? ""} />
            <Input label="Modificador de precio ($)" name="priceModifier" type="number" defaultValue={editingOption ? fmt(editingOption.option.priceModifier) : "0"} />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setShowOptionForm(null); setEditingOption(null); }} className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancelar</button>
              <button type="submit" disabled={pending === "option"} className="flex-1 py-2.5 rounded-xl bg-[#11BEE8] text-black text-sm font-semibold disabled:opacity-50">
                {pending === "option" ? "Guardando..." : "Guardar"}
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
            <h2 className="text-lg font-bold text-zinc-900 mb-1">¿Eliminar {deleteTarget.type === "group" ? "grupo" : "opción"}?</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Se eliminará permanentemente <strong>{deleteTarget.name}</strong>.
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

function Input({ label, name, type = "text", defaultValue = "" }: { label: string; name: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
      />
    </div>
  );
}
