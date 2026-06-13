"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Zap, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Primitives"
import { useAuth } from "@/components/AuthProvider"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const { user, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) router.replace(redirectTo)
  }, [user, loading, router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(
        authError.message.includes("Invalid login")
          ? "Correo o contraseña incorrectos."
          : authError.message
      )
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-surqo-green animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surqo-bg">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-7 group">
            <Zap className="w-5 h-5 text-surqo-green" />
            <span className="text-xl font-black tracking-tighter text-gradient">SURQO</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-surqo-text">Bienvenido de vuelta</h1>
          <p className="text-sm text-surqo-text-secondary font-medium mt-1">Ingresa para continuar al dashboard</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl border border-white/[0.08] p-7 shadow-2xl">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              Iniciar sesión
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-surqo-text-secondary mt-6 font-medium">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-surqo-green-bright font-bold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-surqo-green animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
