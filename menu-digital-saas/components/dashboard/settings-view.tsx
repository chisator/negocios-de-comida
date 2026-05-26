"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Key, Eye, EyeOff, Check } from "lucide-react";
import { saveMpCredentials } from "@/app/actions/superadmin";

interface SettingsViewProps {
  shop: {
    id: string;
    mpAccessToken: string | null;
    mpPublicKey: string | null;
  };
}

export function SettingsView({ shop }: SettingsViewProps) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(shop.mpAccessToken ?? "");
  const [publicKey, setPublicKey] = useState(shop.mpPublicKey ?? "");
  const [showToken, setShowToken] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setSaved(false);

    const form = new FormData();
    form.append("shopId", shop.id);
    form.append("mpAccessToken", accessToken);
    form.append("mpPublicKey", publicKey);

    const result = await saveMpCredentials(form);
    if (result?.error) {
      setErrors(Object.fromEntries(Object.entries(result.error).map(([k, v]) => [k, (v as string[]).join(", ")])));
      setPending(false);
      return;
    }

    setSaved(true);
    setPending(false);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Configuración</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestioná los ajustes de tu tienda</p>
      </div>

      {/* MercadoPago Section */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="w-10 h-10 rounded-xl bg-[#11BEE8]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#11BEE8]" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900 text-sm">MercadoPago</h2>
            <p className="text-xs text-zinc-500">
              {shop.mpAccessToken ? "Conectado · Las credenciales están configuradas" : "No configurado · Conectá tu cuenta para recibir pagos"}
            </p>
          </div>
          {shop.mpAccessToken && (
            <span className="ml-auto px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Activo
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Access Token (producción)
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
              />
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.mpAccessToken && <p className="text-xs text-red-500 mt-1">{errors.mpAccessToken}</p>}
            <p className="text-xs text-zinc-400 mt-1.5">
              Obtenelo en MercadoPago &gt; Configuración &gt; Credenciales de producción
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Public Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full pl-10 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
              />
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            </div>
            {errors.mpPublicKey && <p className="text-xs text-red-500 mt-1">{errors.mpPublicKey}</p>}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 rounded-xl bg-[#11BEE8] text-black text-sm font-semibold hover:bg-[#0fa8d0] disabled:opacity-50 transition-colors"
          >
            {pending ? "Guardando..." : saved ? "Guardado ✓" : "Guardar credenciales"}
          </button>
        </form>
      </div>
    </div>
  );
}
