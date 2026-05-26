"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/actions/admin";
import {
  Clock,
  MapPin,
  Store,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Package,
} from "lucide-react";

type OptionItem = {
  id: string;
  option: {
    id: string;
    name: string;
    priceModifier: { toString(): string };
  };
};

type OrderItem = {
  id: string;
  productId: string;
  product: { id: string; name: string };
  unitPrice: { toString(): string };
  totalPrice: { toString(): string };
  selectedOptions: OptionItem[];
  specialNotes: string | null;
};

type OrderData = {
  id: string;
  status: string;
  totalAmount: { toString(): string };
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
};

interface OrdersViewProps {
  shopSlug: string;
  orders: OrderData[];
}

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARING: "bg-purple-50 text-purple-700 border-purple-200",
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Listo",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

function parseNotes(notes: string | null): Record<string, string> {
  if (!notes) return {};
  const result: Record<string, string> = {};
  for (const line of notes.split("\n")) {
    const [key, ...rest] = line.split(": ");
    if (key && rest.length) result[key] = rest.join(": ");
  }
  return result;
}

function formatPrice(n: { toString(): string }): string {
  return Number(n.toString()).toFixed(2);
}

export function OrdersView({ shopSlug, orders }: OrdersViewProps) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  function toggleExpand(id: string) {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setPendingStatus(orderId);
    const form = new FormData();
    form.append("orderId", orderId);
    form.append("shopSlug", shopSlug);
    form.append("status", newStatus);
    await updateOrderStatus(form);
    setPendingStatus(null);
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <h1 className="text-xl font-bold text-zinc-900 mb-1">Pedidos</h1>
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-12 text-center mt-6">
          <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No hay pedidos aún</p>
          <p className="text-sm text-zinc-400 mt-1">Los pedidos aparecerán acá cuando los clientes compren</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Pedidos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const info = parseNotes(order.notes);
          const isExpanded = expandedIds.has(order.id);

          return (
            <div
              key={order.id}
              className="bg-white border border-zinc-200 rounded-xl overflow-hidden"
            >
              {/* Order Header */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_COLORS[order.status] ?? "bg-zinc-50 text-zinc-500 border-zinc-200"}`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-zinc-900 truncate">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(order.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-900">
                    ${formatPrice(order.totalAmount)}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-zinc-100 px-4 py-4 space-y-4">
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {info["Cliente"] && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Cliente</p>
                        <p className="text-zinc-900 font-medium truncate">
                          {info["Cliente"]}
                        </p>
                      </div>
                    )}
                    {info["Tipo"] && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Tipo</p>
                        <p className="text-zinc-900 flex items-center gap-1">
                          {info["Tipo"] === "Delivery" ? (
                            <MapPin className="w-3.5 h-3.5 text-pink-500" />
                          ) : (
                            <Store className="w-3.5 h-3.5 text-[#11BEE8]" />
                          )}
                          {info["Tipo"]}
                        </p>
                      </div>
                    )}
                    {info["Dirección"] && (
                      <div className="col-span-2">
                        <p className="text-xs text-zinc-400 mb-0.5">Dirección</p>
                        <p className="text-zinc-900">{info["Dirección"]}</p>
                      </div>
                    )}
                    {info["Pago"] && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Pago</p>
                        <p className="text-zinc-900 flex items-center gap-1">
                          {info["Pago"].includes("MercadoPago") ? (
                            <CreditCard className="w-3.5 h-3.5 text-[#11BEE8]" />
                          ) : info["Pago"].includes("Efectivo") ? (
                            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                          )}
                          {info["Pago"]}
                        </p>
                      </div>
                    )}
                    {info["Fecha"] && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Fecha/Hora</p>
                        <p className="text-zinc-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {info["Fecha"]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Productos</p>
                    <div className="space-y-2">
                      {order.items.map((item) => {
                        const modifierNames = item.selectedOptions
                          .map((so) => so.option.name)
                          .join(", ");

                        return (
                          <div
                            key={item.id}
                            className="flex items-start justify-between bg-zinc-50 rounded-lg px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900">
                                1x {item.product?.name ?? "Producto"}
                              </p>
                              {modifierNames && (
                                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                                  + {modifierNames}
                                </p>
                              )}
                              {item.specialNotes && (
                                <p className="text-xs text-pink-500 mt-0.5 italic">
                                  &ldquo;{item.specialNotes}&rdquo;
                                </p>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-zinc-700 ml-2 shrink-0">
                              ${formatPrice(item.totalPrice)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nota del pedido */}
                  {info["Nota"] && (
                    <div className="bg-pink-50 border border-pink-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-pink-600 italic">
                        &ldquo;{info["Nota"]}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Status Management */}
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Cambiar estado</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_FLOW.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(order.id, s)}
                          disabled={pendingStatus === order.id || order.status === s}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            order.status === s
                              ? STATUS_COLORS[s]
                              : "border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
                          } disabled:opacity-50`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
