"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Primitives"
import { useAuth } from "@/components/AuthProvider"

function strengthLabel(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "", width: "0%" }
  if (pw.length < 6) return { label: "Muy corta", color: "bg-surqo-danger", width: "25%" }
  if (pw.length < 10) return { label: "Aceptable", color: "bg-surqo-warning", width: "55%" }
  if (/[^a-zA-Z0-9]/.test(pw) && /[0-9]/.test(pw)) return { label: "Fuerte", color: "bg-surqo-green", width: "100%" }
  return { label: "Buena", color: "bg-surqo-sky", width: "75%" }
}

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [user, loading, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      setError(authError.message)
      setSubmitting(false)
    } else {
      setSuccess(true)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-surqo-green animate-spin" />
    </div>
  )

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surqo-bg">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-8">
          <Zap className="w-5 h-5 text-surqo-green" />
          <span className="text-xl font-black tracking-tighter text-gradient">SURQO</span>
        </Link>
        <div className="glass rounded-3xl border border-surqo-green/20 p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-surqo-green" />
          </div>
          <h2 className="text-2xl font-black text-surqo-text mb-2 tracking-tight">¡Cuenta creada!</h2>
          <p className="text-sm text-surqo-text-secondary font-medium mb-1">
            Revisa tu correo
          </p>
          <p className="text-sm font-bold text-surqo-text mb-6">{email}</p>
          <p className="text-xs text-surqo-text-muted mb-6">
            Confirma tu dirección de correo para activar la cuenta y luego inicia sesión.
          </p>
          <Button asChild className="w-full gap-2">
            <Link href="/login">
              <ArrowRight className="w-4 h-4" />
              Ir al inicio de sesión
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )

  const strength = strengthLabel(password)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surqo-bg">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-7">
            <Zap className="w-5 h-5 text-surqo-green" />
            <span className="text-xl font-black tracking-tighter text-gradient">SURQO</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-surqo-text">Crea tu cuenta</h1>
          <p className="text-sm text-surqo-text-secondary font-medium mt-1">
            Gratis · 1 finca · Análisis con IA
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl border border-white/[0.08] p-7 shadow-2xl">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">

            <div>
              <label htmlFor="email" className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surqo-text-muted hover:text-surqo-text transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  {strength.label && (
                    <p className="text-[11px] text-surqo-text-muted font-medium">{strength.label}</p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-surqo-danger/10 border border-surqo-danger/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-surqo-danger shrink-0 mt-0.5" />
                <p className="text-sm text-surqo-danger font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full gap-2 mt-1" disabled={submitting}>
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ArrowRight className="w-4 h-4" />}
              Crear cuenta gratis
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-surqo-text-muted">
              <Shield className="w-3 h-3" />
              <span>Autenticación segura vía Supabase</span>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-surqo-text-secondary mt-6 font-medium">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-surqo-green-bright font-bold hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
