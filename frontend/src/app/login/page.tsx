"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Leaf } from "lucide-react"
import { SurqoIcon } from "@/components/SurqoIcon"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"

const LIME = "#86E66A"

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{ y: [0, -24, 0], opacity: [0.35, 0.6, 0.35] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
    />
  )
}

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
  const [focused, setFocused] = useState<string | null>(null)

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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0d1f0d" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="w-7 h-7" style={{ color: LIME }} />
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#0d1f0d" }}>

      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/campo-surqo.webp"
          alt="Campo"
          fill
          priority
          quality={80}
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,31,13,0.92) 0%, rgba(13,31,13,0.75) 100%)" }} />
      </div>

      {/* Orbs */}
      <FloatingOrb className="w-72 h-72 top-[-60px] left-[-60px]" style={{ background: "rgba(134,230,106,0.12)" } as React.CSSProperties} delay={0} />
      <FloatingOrb className="w-96 h-96 bottom-[-80px] right-[-80px]" style={{ background: "rgba(134,230,106,0.08)" } as React.CSSProperties} delay={2} />
      <FloatingOrb className="w-48 h-48 top-[40%] right-[10%]" style={{ background: "rgba(134,230,106,0.06)" } as React.CSSProperties} delay={4} />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-5">
            <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
              <SurqoIcon className="w-10 h-10" style={{ color: LIME }} />
            </motion.div>
            <span className="text-3xl font-black tracking-tighter text-white">SURQO</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white">Bienvenido de vuelta</h1>
          <p className="text-sm font-medium mt-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            Ingresa para continuar al dashboard
          </p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
            borderRadius: "24px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          className="p-8"
        >
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Email */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <label htmlFor="email" className="block text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                Correo electrónico
              </label>
              <motion.div
                animate={{ boxShadow: focused === "email" ? `0 0 0 2px ${LIME}40` : "0 0 0 0px transparent" }}
                transition={{ duration: 0.2 }}
                style={{ borderRadius: "12px" }}
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/25 text-sm font-medium outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${focused === "email" ? `${LIME}60` : "rgba(255,255,255,0.1)"}`,
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Password */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <label htmlFor="password" className="block text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                Contraseña
              </label>
              <motion.div
                className="relative"
                animate={{ boxShadow: focused === "password" ? `0 0 0 2px ${LIME}40` : "0 0 0 0px transparent" }}
                transition={{ duration: 0.2 }}
                style={{ borderRadius: "12px" }}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full px-4 py-3 pr-11 rounded-xl text-white placeholder-white/25 text-sm font-medium outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${focused === "password" ? `${LIME}60` : "rgba(255,255,255,0.1)"}`,
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  whileTap={{ scale: 0.85 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.02, y: -1 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black tracking-wide text-sm transition-all"
                style={{
                  background: submitting ? "rgba(134,230,106,0.4)" : `linear-gradient(135deg, ${LIME} 0%, #6abf50 100%)`,
                  color: "#0d1f0d",
                  boxShadow: submitting ? "none" : `0 8px 24px ${LIME}40`,
                }}
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ArrowRight className="w-4 h-4" />}
                {submitting ? "Ingresando..." : "Iniciar sesión"}
              </motion.button>
            </motion.div>

          </form>
        </motion.div>

        {/* Footer link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center text-sm font-medium mt-6"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-bold hover:underline transition-colors" style={{ color: LIME }}>
            Regístrate gratis
          </Link>
        </motion.p>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex items-center justify-center gap-1.5 mt-4"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Leaf className="w-3 h-3" />
          <span className="text-xs font-medium tracking-wide">Plataforma agro-inteligente</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0d1f0d" }}>
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#86E66A" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
