"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Primitives"
import { useAuth } from "@/components/AuthProvider"

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-surqo-green" />
            <span className="text-2xl font-black tracking-tighter text-gradient">SURQO</span>
          </div>
          <div className="glass rounded-3xl border border-surqo-green/20 p-8 shadow-xl">
            <CheckCircle className="w-12 h-12 text-surqo-green mx-auto mb-4" />
            <h2 className="text-xl font-black text-surqo-text mb-2">¡Cuenta creada!</h2>
            <p className="text-sm text-surqo-text-secondary mb-6">
              Revisa tu correo <span className="font-bold text-surqo-text">{email}</span> para confirmar tu cuenta y luego inicia sesión.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Ir al inicio de sesión</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-surqo-green" />
            <span className="text-2xl font-black tracking-tighter text-gradient">SURQO</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-surqo-text mb-2">Crea tu cuenta</h1>
          <p className="text-sm text-surqo-text-secondary font-medium">
            Gratis · 3 fincas · Alertas básicas
          </p>
        </div>

        {/* Form */}
        <div className="glass rounded-3xl border border-white/10 p-6 shadow-xl">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email">Correo electrónico</label>
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
              <label htmlFor="password">Contraseña</label>
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
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full mt-1" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear cuenta gratis
            </Button>

            <p className="text-center text-xs text-surqo-text-muted">
              Al registrarte aceptas nuestros términos de uso y política de privacidad.
            </p>
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
