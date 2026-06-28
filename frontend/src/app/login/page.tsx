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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const { user, loading } = useAuth()

  const [email,        setEmail]        = useState("")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [focused,      setFocused]      = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) router.replace(redirectTo)
  }, [user, loading, router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un correo electrónico válido.")
      return
    }
    if (!password) {
      setError("Ingresa tu contraseña.")
      return
    }

    setSubmitting(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (authError) {
      const msg = authError.message.toLowerCase()
      setError(
        msg.includes("invalid login") || msg.includes("invalid credentials")
          ? "Correo o contraseña incorrectos."
          : msg.includes("email not confirmed")
          ? "Debes confirmar tu correo electrónico antes de iniciar sesión."
          : msg.includes("too many requests")
          ? "Demasiados intentos. Espera unos minutos e intenta de nuevo."
          : "Ocurrió un error al iniciar sesión. Intenta de nuevo."
      )
      setSubmitting(false)
    } else {
      router.replace(redirectTo)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a180a" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="w-7 h-7" style={{ color: LIME }} />
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-12">

      {/* ── Background image ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/cta-bg.webp"
          alt="Vista aérea campo agrícola"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* dark overlay — left stronger so the card reads well */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, rgba(5,15,5,0.88) 0%, rgba(5,15,5,0.72) 50%, rgba(5,15,5,0.55) 100%)",
          }}
        />
        {/* subtle lime tint at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(134,230,106,0.06), transparent)" }}
        />
      </div>

      {/* ── Animated orbs ── */}
      {[
        { w: 340, h: 340, top: -100, left: -100, delay: 0 },
        { w: 260, h: 260, bottom: -80, right: -80, delay: 2.5 },
        { w: 180, h: 180, top: "45%", right: "8%", delay: 4.5 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{
            width: orb.w, height: orb.h,
            top: (orb as any).top, left: (orb as any).left,
            bottom: (orb as any).bottom, right: (orb as any).right,
            background: "rgba(134,230,106,0.10)",
          }}
          animate={{ y: [0, -22, 0], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
        />
      ))}

      {/* ── Card ── */}
      <motion.div
        className="relative z-10 w-full max-w-[420px]"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >

        {/* Brand */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
            <motion.div whileHover={{ rotate: 12, scale: 1.12 }} transition={{ type: "spring", stiffness: 280 }}>
              {/* white icon on dark bg */}
              <SurqoIcon className="w-11 h-11 text-white drop-shadow-lg" />
            </motion.div>
            <span className="text-3xl font-black tracking-tighter text-white drop-shadow-md">SURQO</span>
          </Link>
          <h1 className="text-[1.75rem] font-black tracking-tight text-white leading-tight text-center">
            Bienvenido de vuelta
          </h1>
          <p className="text-sm font-medium mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.52)" }}>
            Ingresa para continuar al dashboard
          </p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(28px) saturate(160%)",
            WebkitBackdropFilter: "blur(28px) saturate(160%)",
            borderRadius: "20px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.1)",
          }}
          className="px-7 pt-7 pb-8"
        >
          <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 }}
            >
              <label htmlFor="email" className="block text-[11px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.42)" }}>
                Correo electrónico
              </label>
              <motion.div
                style={{ borderRadius: 12 }}
                animate={{ boxShadow: focused === "email" ? `0 0 0 2.5px ${LIME}50` : "0 0 0 0px transparent" }}
                transition={{ duration: 0.18 }}
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white placeholder-white/25 outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: `1.5px solid ${focused === "email" ? `${LIME}55` : "rgba(255,255,255,0.11)"}`,
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.34 }}
            >
              <label htmlFor="password" className="block text-[11px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.42)" }}>
                Contraseña
              </label>
              <motion.div
                className="relative"
                style={{ borderRadius: 12 }}
                animate={{ boxShadow: focused === "password" ? `0 0 0 2.5px ${LIME}50` : "0 0 0 0px transparent" }}
                transition={{ duration: 0.18 }}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm font-medium text-white placeholder-white/25 outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: `1.5px solid ${focused === "password" ? `${LIME}55` : "rgba(255,255,255,0.11)"}`,
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  whileTap={{ scale: 0.82 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: -8 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: -8 }}
                  className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5"
                  style={{ background: "rgba(239,68,68,0.13)", border: "1px solid rgba(239,68,68,0.28)" }}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="mt-1"
            >
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.025, y: -1 } : {}}
                whileTap={!submitting ? { scale: 0.975 } : {}}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black tracking-wide text-[0.9rem] transition-all"
                style={{
                  background: submitting
                    ? "rgba(134,230,106,0.35)"
                    : `linear-gradient(135deg, ${LIME} 0%, #6abf52 100%)`,
                  color: "#071207",
                  boxShadow: submitting ? "none" : `0 6px 22px ${LIME}45`,
                  cursor: submitting ? "not-allowed" : "pointer",
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

        {/* Footer */}
        <motion.div
          className="flex flex-col items-center gap-3 mt-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.42)" }}>
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-bold transition-colors hover:underline"
              style={{ color: LIME }}
            >
              Regístrate gratis
            </Link>
          </p>
          <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.22)" }}>
            <Leaf className="w-3 h-3" />
            <span className="text-[11px] font-medium tracking-wide">Plataforma agro-inteligente</span>
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a180a" }}>
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: LIME }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
