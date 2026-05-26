"use client";

import { useState, useRef } from "react";
import { signInWithGoogle, signInWithPhone, verifyPhoneOtp } from "@/app/auth/actions";
import { ChefHat, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    if (phone.length < 10) {
      setError("Ingresá un número de teléfono válido");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await signInWithPhone(phone);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setStep("otp");
      setLoading(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }

  function handleTokenChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...token];
    next[index] = value.slice(0, 1);
    setToken(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleTokenKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !token[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp() {
    const code = token.join("");
    if (code.length < 6) {
      setError("Ingresá el código completo de 6 dígitos");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await verifyPhoneOtp(phone, code);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#11BEE8] to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(17,190,232,0.3)]">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Menú Digital</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Iniciá sesión para pedir o gestionar tu tienda
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-zinc-800 font-medium text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-500 font-medium">o</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {step === "phone" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Número de teléfono
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm">
                    +54
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="11 1234 5678"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#11BEE8] text-black font-semibold text-sm hover:bg-[#0fa8d0] transition-colors disabled:opacity-50 shadow-[0_0_16px_rgba(17,190,232,0.3)]"
              >
                {loading ? "Enviando..." : "Enviar código"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setStep("phone");
                  setToken(["", "", "", "", "", ""]);
                  setError(null);
                }}
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <div>
                <p className="text-sm text-zinc-300 text-center mb-1">
                  Código enviado a{" "}
                  <span className="text-[#11BEE8] font-medium">+54 {phone}</span>
                </p>
                <p className="text-xs text-zinc-500 text-center mb-4">
                  Ingresá el código de 6 dígitos
                </p>

                <div className="flex justify-center gap-2">
                  {token.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleTokenChange(i, e.target.value)}
                      onKeyDown={(e) => handleTokenKeyDown(i, e)}
                      className="w-11 h-14 rounded-xl bg-zinc-800 border border-zinc-700 text-center text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#11BEE8]/30 focus:border-[#11BEE8]"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#11BEE8] text-black font-semibold text-sm hover:bg-[#0fa8d0] transition-colors disabled:opacity-50 shadow-[0_0_16px_rgba(17,190,232,0.3)]"
              >
                {loading ? "Verificando..." : "Verificar código"}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
