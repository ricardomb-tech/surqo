"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, ArrowRight, Shield, User, Mail, Lock,
} from "lucide-react"
import { SurqoIcon } from "@/components/SurqoIcon"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Primitives"
import { useAuth } from "@/components/AuthProvider"

// ── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: "", color: "" }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (pw.length < 6) return { score: 1, label: "Muy corta", color: "bg-surqo-danger" }
  const map = [
    { score: 1, label: "Débil",    color: "bg-surqo-danger" },
    { score: 2, label: "Aceptable", color: "bg-surqo-warning" },
    { score: 3, label: "Buena",    color: "bg-surqo-sky" },
    { score: 4, label: "Fuerte",   color: "bg-surqo-green" },
  ]
  return map[Math.min(score, 4) - 1]
}

// ── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  id, label, icon: Icon, error, children,
}: {
  id: string
  label: string
  icon: React.ElementType
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-surqo-danger font-medium mt-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" })
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, confirm: false })
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm,  setShowConfirm]    = useState(false)
  const [acceptTerms,  setAcceptTerms]    = useState(false)
  const [submitting,   setSubmitting]     = useState(false)
  const [serverError,  setServerError]    = useState<string | null>(null)
  const [success,      setSuccess]        = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [user, loading, router])

  // ── Inline validation
  const errors = {
    fullName: touched.fullName && form.fullName.trim().length < 2
      ? "Ingresa tu nombre completo"
      : null,
    email: touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? "Correo no válido"
      : null,
    password: touched.password && form.password.length < 6
      ? "Mínimo 6 caracteres"
      : null,
    confirm: touched.confirm && form.confirm !== form.password
      ? "Las contraseñas no coinciden"
      : null,
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const blur = (k: keyof typeof touched) => () =>
    setTouched((t) => ({ ...t, [k]: true }))

  const canSubmit =
    form.fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 6 &&
    form.password === form.confirm &&
    acceptTerms

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ fullName: true, email: true, password: true, confirm: true })
    if (!canSubmit) return

    setSubmitting(true)
    setServerError(null)

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName.trim() },
      },
    })

    if (authError) {
      const msg = authError.message.includes("already registered")
        ? "Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión?"
        : authError.message
      setServerError(msg)
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

  // ── Success state
  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surqo-bg">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-8">
          <SurqoIcon className="w-10 h-10 text-surqo-green" />
          <span className="text-2xl font-black tracking-tighter text-gradient">SURQO</span>
        </Link>
        <div className="glass rounded-3xl border border-surqo-green/20 p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-surqo-green" />
          </div>
          <h2 className="text-2xl font-black text-surqo-text mb-2 tracking-tight">¡Cuenta creada!</h2>
          <p className="text-sm text-surqo-text-secondary font-medium mb-1">
            Hola, <span className="font-bold text-surqo-text">{form.fullName}</span>
          </p>
          <p className="text-sm text-surqo-text-secondary font-medium mb-6">
            Revisa tu correo <span className="font-bold text-surqo-text">{form.email}</span> y confirma tu cuenta para activarla.
          </p>
          <Button asChild className="w-full gap-2">
            <Link href="/login">
              <ArrowRight className="w-4 h-4" />
              Ir a iniciar sesión
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )

  const strength = getStrength(form.password)
  const strengthWidth = ["0%", "25%", "50%", "75%", "100%"][strength.score]

  // ── Form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-surqo-bg">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <SurqoIcon className="w-10 h-10 text-surqo-green" />
            <span className="text-2xl font-black tracking-tighter text-gradient">SURQO</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-surqo-text">Crea tu cuenta</h1>
          <p className="text-sm text-surqo-text-secondary font-medium mt-1">
            Gratis · Análisis IA · Dashboard en tiempo real
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl border border-white/[0.08] p-7 shadow-2xl">
          <form onSubmit={handleRegister} className="flex flex-col gap-5" noValidate>

            {/* Full name */}
            <Field id="fullName" label="Nombre completo" icon={User} error={errors.fullName}>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Ej: Carlos Pérez"
                value={form.fullName}
                onChange={set("fullName")}
                onBlur={blur("fullName")}
                required
                className={`w-full ${errors.fullName ? "border-surqo-danger/50 focus:ring-surqo-danger/30" : ""}`}
              />
            </Field>

            {/* Email */}
            <Field id="email" label="Correo electrónico" icon={Mail} error={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={set("email")}
                onBlur={blur("email")}
                required
                className={`w-full ${errors.email ? "border-surqo-danger/50 focus:ring-surqo-danger/30" : ""}`}
              />
            </Field>

            {/* Password */}
            <Field id="password" label="Contraseña" icon={Lock} error={errors.password}>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={set("password")}
                  onBlur={blur("password")}
                  minLength={6}
                  required
                  className={`w-full pr-10 ${errors.password ? "border-surqo-danger/50" : ""}`}
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
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strengthWidth }}
                    />
                  </div>
                  <p className="text-[11px] text-surqo-text-muted font-medium">{strength.label}</p>
                </div>
              )}
            </Field>

            {/* Confirm password */}
            <Field id="confirm" label="Confirmar contraseña" icon={Lock} error={errors.confirm}>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={form.confirm}
                  onChange={set("confirm")}
                  onBlur={blur("confirm")}
                  required
                  className={`w-full pr-10 ${errors.confirm ? "border-surqo-danger/50" : form.confirm && form.confirm === form.password ? "border-surqo-green/40" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surqo-text-muted hover:text-surqo-text transition-colors"
                  aria-label="Mostrar contraseña"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirm && form.confirm === form.password && !errors.confirm && (
                <p className="flex items-center gap-1.5 text-xs text-surqo-green font-medium mt-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Las contraseñas coinciden
                </p>
              )}
            </Field>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  acceptTerms
                    ? "bg-surqo-green border-surqo-green"
                    : "border-white/20 bg-white/[0.04] group-hover:border-surqo-green/50"
                }`}>
                  {acceptTerms && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
              <span className="text-xs text-surqo-text-muted font-medium leading-relaxed">
                Acepto los{" "}
                <Link href="/terminos" target="_blank" className="text-surqo-green-bright hover:underline font-bold">
                  Términos de Uso
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" target="_blank" className="text-surqo-green-bright hover:underline font-bold">
                  Política de Privacidad
                </Link>
              </span>
            </label>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 bg-surqo-danger/10 border border-surqo-danger/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-surqo-danger shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-surqo-danger font-medium">{serverError}</p>
                  {serverError.includes("iniciar sesión") && (
                    <Link href="/login" className="text-xs text-surqo-danger/80 font-bold hover:underline">
                      Ir a iniciar sesión →
                    </Link>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 mt-1"
              disabled={submitting || !canSubmit}
            >
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ArrowRight className="w-4 h-4" />}
              Crear cuenta gratis
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-surqo-text-muted">
              <Shield className="w-3 h-3" />
              <span>Autenticación segura · Supabase Auth</span>
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

// inline import for the Check icon used in checkbox
function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  )
}
