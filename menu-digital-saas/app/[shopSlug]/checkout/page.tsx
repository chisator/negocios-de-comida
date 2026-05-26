"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Banknote, Smartphone, MapPin, Store, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { processOrder } from "@/app/actions/checkout";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, shopSlug, totalAmount, removeItem, clearCart } = useCartStore();

  const [deliveryType, setDeliveryType] = useState<"delivery" | "takeaway">("delivery");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mercadopago" | "transfer">("mercadopago");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <p className="text-zinc-400 text-lg mb-4">Tu carrito está vacío</p>
        <Link
          href={shopSlug ? `/${shopSlug}` : "/"}
          className="px-6 py-3 rounded-xl bg-[#11BEE8] text-black font-semibold text-sm"
        >
          Volver al menú
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const form = new FormData();
    form.append("shopSlug", shopSlug ?? "");
    form.append("deliveryType", deliveryType);
    form.append("scheduledDate", scheduledDate);
    form.append("scheduledTime", scheduledTime);
    form.append("customerName", customerName);
    form.append("customerPhone", customerPhone);
    form.append("customerEmail", customerEmail);
    form.append("address", address);
    form.append("paymentMethod", paymentMethod);
    form.append("notes", notes);
    form.append(
      "items",
      JSON.stringify(
        items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          basePrice: i.basePrice,
          totalPrice: i.totalPrice,
          selections: i.selections,
          specialNotes: i.specialNotes,
        })),
      ),
    );

    const result = await processOrder(form);

    if (result?.error) {
      setErrors(
        Object.fromEntries(
          Object.entries(result.error).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : v]),
        ),
      );
      setPending(false);
      return;
    }

    clearCart();

    if (result?.mp) {
      window.location.href = result.redirect;
      return;
    }

    if (result?.redirect) {
      router.push(result.redirect);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <Link href={shopSlug ? `/${shopSlug}` : "/"} className="p-1 text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-lg">Checkout</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-5">
        {/* Delivery / Takeaway Toggle */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 flex">
          {(["delivery", "takeaway"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDeliveryType(type)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                deliveryType === type
                  ? "bg-[#11BEE8] text-black shadow-[0_0_12px_rgba(17,190,232,0.3)]"
                  : "text-zinc-400"
              }`}
            >
              {type === "delivery" ? <MapPin className="w-4 h-4" /> : <Store className="w-4 h-4" />}
              {type === "delivery" ? "Delivery" : "Para llevar"}
            </button>
          ))}
        </div>

        {/* Schedule */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-pink-500" />
            ¿Cuándo lo querés?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Día</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8] [color-scheme:dark]"
              />
              {errors.scheduledDate && <p className="text-xs text-red-400 mt-1">{errors.scheduledDate}</p>}
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Horario</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8] [color-scheme:dark]"
              />
              {errors.scheduledTime && <p className="text-xs text-red-400 mt-1">{errors.scheduledTime}</p>}
            </div>
          </div>
        </div>

        {/* Customer Data */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-pink-500" />
            Tus datos
          </h3>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nombre completo"
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
          />
          {errors.customerName && <p className="text-xs text-red-400 -mt-2">{errors.customerName}</p>}

          <div className="flex gap-2">
            <span className="flex items-center px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm">
              +54
            </span>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="Teléfono"
              className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
            />
          </div>
          {errors.customerPhone && <p className="text-xs text-red-400 -mt-2">{errors.customerPhone}</p>}

          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email (opcional)"
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
          />
        </div>

        {/* Address (delivery only) */}
        {deliveryType === "delivery" && (
          <div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección de entrega"
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
            />
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-pink-500" />
            Método de pago
          </h3>
          <div className="space-y-2">
            {([
              { value: "mercadopago", label: "MercadoPago", icon: CreditCard, desc: "Tarjeta, débito o dinero en cuenta" },
              { value: "cash", label: "Efectivo", icon: Banknote, desc: "Pagás al recibir el pedido" },
              { value: "transfer", label: "Transferencia", icon: Smartphone, desc: "Te pasamos los datos por WhatsApp" },
            ] as const).map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(pm.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  paymentMethod === pm.value
                    ? "border-[#11BEE8] bg-[#11BEE8]/5"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  paymentMethod === pm.value ? "bg-[#11BEE8]/10 text-[#11BEE8]" : "bg-zinc-800 text-zinc-500"
                }`}>
                  <pm.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{pm.label}</p>
                  <p className="text-zinc-500 text-xs">{pm.desc}</p>
                </div>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === pm.value ? "border-[#11BEE8]" : "border-zinc-600"
                }`}>
                  {paymentMethod === pm.value && <div className="w-2.5 h-2.5 rounded-full bg-[#11BEE8]" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Algo que debamos saber? (sin cebolla, sin sal, etc.)"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8] resize-none"
          />
        </div>

        {/* Cart Summary */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-pink-500" />
            Tu pedido
          </h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.productName}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    ${item.basePrice.toFixed(2)}
                    {Object.values(item.selections).flat().length > 0 && " + opciones"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#11BEE8] font-bold text-sm">${item.totalPrice.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-[#11BEE8]/5 border border-[#11BEE8]/20 rounded-xl p-4">
            <span className="text-white font-semibold">Total</span>
            <span className="text-[#11BEE8] font-bold text-xl">${totalAmount().toFixed(2)}</span>
          </div>
        </div>

        {/* Errors */}
        {errors._form && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{errors._form}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-2xl bg-[#11BEE8] text-black font-bold text-base shadow-[0_0_20px_rgba(17,190,232,0.4)] disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {pending
            ? "Procesando..."
            : paymentMethod === "mercadopago"
              ? `Pagar con MercadoPago · $${totalAmount().toFixed(2)}`
              : `Confirmar pedido · $${totalAmount().toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
