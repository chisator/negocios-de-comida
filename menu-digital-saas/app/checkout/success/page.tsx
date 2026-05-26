"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, MessageCircle } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const method = searchParams.get("method");

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-emerald-400" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">¡Pedido confirmado!</h1>
      <p className="text-zinc-400 text-sm mb-8 max-w-xs">
        {method === "mercadopago"
          ? "Tu pago fue procesado correctamente. Te avisaremos cuando tu pedido esté listo."
          : "Recibimos tu pedido. Te contactaremos pronto para confirmar."}
      </p>

      {orderId && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-3 mb-8">
          <p className="text-zinc-500 text-xs">Nº de pedido</p>
          <p className="text-white font-mono font-bold text-lg">{orderId.slice(0, 8).toUpperCase()}</p>
        </div>
      )}

      <div className="space-y-3 w-full max-w-xs">
        {method === "transfer" && (
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <MessageCircle className="w-5 h-5 text-[#11BEE8]" />
            <p className="text-sm text-zinc-300 text-left">
              Te enviamos los datos de transferencia por WhatsApp
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <Clock className="w-5 h-5 text-pink-500" />
          <p className="text-sm text-zinc-300 text-left">
            Tiempo estimado: <span className="text-white font-medium">25-35 min</span>
          </p>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 px-8 py-3 rounded-xl bg-[#11BEE8] text-black font-semibold text-sm shadow-[0_0_16px_rgba(17,190,232,0.3)]"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

import { Suspense } from "react";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#11BEE8] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
