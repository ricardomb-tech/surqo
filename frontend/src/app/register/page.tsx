"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, ArrowRight, Shield, User, Mail, Lock, Leaf,
} from "lucide-react"
import { SurqoIcon } from "@/components/SurqoIcon"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"

const LIME = "#86E66A"

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: "", color: "" }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (pw.length < 6) return { score: 1, label: "Muy corta", color: "#ef4444" }
  const map = [
    { score: 1, label: "Débil",     color: "#ef4444" },
    { score: 2, label: "Aceptable", color: "#f59e0b" },
    { score: 3, label: "Buena",     color: "#38bdf8" },
    { score: 4, label: "Fuerte",    color: LIME },
  ]
  return map[Math.min(score, 4) - 1]
}

function FloatingOrb({ style, delay = 0 }: { style: React.CSSProperties; delay?: number }) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={style}
      animate={{ y: [0, -20, 0], opacity: [0.3, 0.55, 0.3] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay }}
    />
  )
}

function GlassInput({
  id, type, placeholder, value, onChange, onFocus, onBlur, focused, error, autoComplete, minLength, required, children,
}: {
  id: string; type: string; placeholder: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: () => void; onBlur?: () => void
  focused?: boolean; error?: boolean; autoComplete?: string; minLength?: number; required?: boolean
  children?: React.ReactNode
}) {
  return (
    <motion.div
      className="relative"
      animate={{ boxShadow: focused ? `0 0 0 2px ${LIME}40` : "0 0 0 0px transparent" }}
      transition={{ duration: 0.2 }}
      style={{ borderRadius: "12px" }}
    >
      <input
        id={id} type={type} placeholder={placeholder} value={value}
        onChange={onChange} onFocus={onFocus} onBlur={onBlur}
        autoComplete={autoComplete} minLength={minLength} required={required}
        className="w-full px-4 py-3 rounded-xl text-white placeholder-white/25 text-sm font-medium outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${error ? "rgba(239,68,68,0.5)" : focused ? `${LIME}60` : "rgba(255,255,255,0.1)"}`,
          paddingRight: children ? "44px" : undefined,
        }}
      />
      {children}
    </motion.div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" })
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, confirm: false })
  const [focused, setFocused] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [acceptTerms,  setAcceptTerms]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [serverError,  setServerError]  = useState<string | null>(null)
  const [success,      setSuccess]      = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [user, loading, router])

  const errors = {
    fullName: touched.fullName && form.fullName.trim().length < 2 ? "Ingresa tu nombre completo" : null,
    email:    touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? "Correo no válido" : null,
    password: touched.password && form.password.length < 6 ? "Mínimo 6 caracteres" : null,
    confirm:  touched.confirm && form.confirm !== form.password ? "Las contraseñas no coinciden" : null,
  }

  const set  = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const blur = (k: keyof typeof touched) => () => setTouched(t => ({ ...t, [k]: true }))

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
      options: { data: { full_name: form.fullName.trim() } },
    })
    if (authError) {
      setServerError(
        authError.message.includes("already registered")
          ? "Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión?"
          : authError.message
      )
      setSubmitting(false)
    } else {
      setSuccess(true)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0d1f0d" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="w-7 h-7" style={{ color: LIME }} />
      </motion.div>
    </div>
  )

  // ── Success
  if (success) return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#0d1f0d" }}>
      <div className="absolute inset-0 z-0">
        <Image src="/campo-surqo.webp" alt="Campo" fill quality={80} sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: "rgba(13,31,13,0.88)" }} />
      </div>
      <motion.div
        className="relative z-10 w-full max-w-md mx-4 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="p-10 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(134,230,106,0.25)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: `${LIME}18`, border: `1px solid ${LIME}35` }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: LIME }} />
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">¡Cuenta creada!</h2>
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Hola, <span className="text-white font-bold">{form.fullName}</span>
          </p>
          <p className="text-sm font-medium mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            Revisa <span className="text-white font-bold">{form.email}</span> y confirma tu cuenta.
          </p>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm"
              style={{ background: `linear-gradient(135deg, ${LIME} 0%, #6abf50 100%)`, color: "#0d1f0d", boxShadow: `0 8px 24px ${LIME}40` }}
            >
              <ArrowRight className="w-4 h-4" />
              Ir a iniciar sesión
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  )

  const strength = getStrength(form.password)
  const strengthWidth = ["0%", "25%", "50%", "75%", "100%"][strength.score]

  const fieldVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: 0.25 + i * 0.07, duration: 0.4 } }),
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-10" style={{ backgroundColor: "#0d1f0d" }}>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/tractor.jpg" alt="Campo" fill quality={80} sizes="100vw" className="object-cover object-center opacity-20" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,31,13,0.95) 0%, rgba(13,31,13,0.80) 100%)" }} />
      </div>

      {/* Orbs */}
      <FloatingOrb style={{ width: 320, height: 320, top: -80, right: -80, background: "rgba(134,230,106,0.10)" }} delay={0} />
      <FloatingOrb style={{ width: 240, height: 240, bottom: -60, left: -60, background: "rgba(134,230,106,0.07)" }} delay={3} />

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Brand */}
        <motion.div className="text-center mb-7" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
            <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
              <SurqoIcon className="w-10 h-10" style={{ color: LIME }} />
            </motion.div>
            <span className="text-3xl font-black tracking-tighter text-white">SURQO</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white">Crea tu cuenta</h1>
          <p className="text-sm font-medium mt-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Gratis · Análisis IA · Dashboard en tiempo real
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
            boxShadow: "0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          className="p-7"
        >
          <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>

            {/* Nombre */}
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="fullName" className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                <User className="w-3.5 h-3.5" /> Nombre completo
              </label>
              <GlassInput
                id="fullName" type="text" placeholder="Ej: Carlos Pérez"
                value={form.fullName} onChange={set("fullName")}
                onFocus={() => setFocused("fullName")} onBlur={() => { setFocused(null); blur("fullName")() }}
                focused={focused === "fullName"} error={!!errors.fullName}
                autoComplete="name" required
              />
              <AnimatePresence>
                {errors.fullName && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5 text-xs font-medium mt-1.5 text-red-400">
                    <AlertCircle className="w-3 h-3" />{errors.fullName}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Email */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Mail className="w-3.5 h-3.5" /> Correo electrónico
              </label>
              <GlassInput
                id="email" type="email" placeholder="tu@correo.com"
                value={form.email} onChange={set("email")}
                onFocus={() => setFocused("email")} onBlur={() => { setFocused(null); blur("email")() }}
                focused={focused === "email"} error={!!errors.email}
                autoComplete="email" required
              />
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5 text-xs font-medium mt-1.5 text-red-400">
                    <AlertCircle className="w-3 h-3" />{errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Lock className="w-3.5 h-3.5" /> Contraseña
              </label>
              <GlassInput
                id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres"
                value={form.password} onChange={set("password")}
                onFocus={() => setFocused("password")} onBlur={() => { setFocused(null); blur("password")() }}
                focused={focused === "password"} error={!!errors.password}
                autoComplete="new-password" minLength={6} required
              >
                <motion.button type="button" onClick={() => setShowPassword(v => !v)} whileTap={{ scale: 0.85 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </GlassInput>
              {/* Strength bar */}
              <AnimatePresence>
                {form.password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1">
                    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        animate={{ width: strengthWidth, backgroundColor: strength.color }}
                        transition={{ duration: 0.35 }}
                      />
                    </div>
                    <p className="text-[11px] font-medium" style={{ color: strength.color }}>{strength.label}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5 text-xs font-medium mt-1.5 text-red-400">
                    <AlertCircle className="w-3 h-3" />{errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Confirm */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
              <label htmlFor="confirm" className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Lock className="w-3.5 h-3.5" /> Confirmar contraseña
              </label>
              <GlassInput
                id="confirm" type={showConfirm ? "text" : "password"} placeholder="Repite tu contraseña"
                value={form.confirm} onChange={set("confirm")}
                onFocus={() => setFocused("confirm")} onBlur={() => { setFocused(null); blur("confirm")() }}
                focused={focused === "confirm"} error={!!errors.confirm}
                autoComplete="new-password" required
              >
                <motion.button type="button" onClick={() => setShowConfirm(v => !v)} whileTap={{ scale: 0.85 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </GlassInput>
              <AnimatePresence>
                {form.confirm && form.confirm === form.password && !errors.confirm && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5 text-xs font-medium mt-1.5" style={{ color: LIME }}>
                    <CheckCircle2 className="w-3 h-3" /> Las contraseñas coinciden
                  </motion.p>
                )}
                {errors.confirm && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5 text-xs font-medium mt-1.5 text-red-400">
                    <AlertCircle className="w-3 h-3" />{errors.confirm}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Terms */}
            <motion.label
              custom={4} variants={fieldVariants} initial="hidden" animate="visible"
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="sr-only" />
                <motion.div
                  animate={{
                    background: acceptTerms ? LIME : "rgba(255,255,255,0.04)",
                    borderColor: acceptTerms ? LIME : "rgba(255,255,255,0.2)",
                  }}
                  className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                >
                  <AnimatePresence>
                    {acceptTerms && (
                      <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="#0d1f0d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,6 5,9 10,3" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
              <span className="text-xs font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Acepto los{" "}
                <Link href="/terminos" target="_blank" className="font-bold hover:underline" style={{ color: LIME }}>Términos de Uso</Link>
                {" "}y la{" "}
                <Link href="/privacidad" target="_blank" className="font-bold hover:underline" style={{ color: LIME }}>Política de Privacidad</Link>
              </span>
            </motion.label>

            {/* Server error */}
            <AnimatePresence>
              {serverError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400 font-medium">{serverError}</p>
                    {serverError.includes("iniciar sesión") && (
                      <Link href="/login" className="text-xs text-red-400/80 font-bold hover:underline">Ir a iniciar sesión →</Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={submitting || !canSubmit}
              whileHover={!submitting && canSubmit ? { scale: 1.02, y: -1 } : {}}
              whileTap={!submitting && canSubmit ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black tracking-wide text-sm mt-1 transition-all"
              style={{
                background: canSubmit && !submitting
                  ? `linear-gradient(135deg, ${LIME} 0%, #6abf50 100%)`
                  : "rgba(255,255,255,0.08)",
                color: canSubmit && !submitting ? "#0d1f0d" : "rgba(255,255,255,0.3)",
                boxShadow: canSubmit && !submitting ? `0 8px 24px ${LIME}40` : "none",
                cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {submitting ? "Creando cuenta..." : "Crear cuenta gratis"}
            </motion.button>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              <Shield className="w-3 h-3" />
              <span className="text-[11px] font-medium">Autenticación segura · Supabase Auth</span>
            </div>

          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="text-center text-sm font-medium mt-6" style={{ color: "rgba(255,255,255,0.4)" }}
        >
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-bold hover:underline" style={{ color: LIME }}>
            Iniciar sesión
          </Link>
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-1.5 mt-4" style={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Leaf className="w-3 h-3" />
          <span className="text-xs font-medium tracking-wide">Plataforma agro-inteligente</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
