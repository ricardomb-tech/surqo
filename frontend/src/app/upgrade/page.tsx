"use client"

import Link from "next/link"
import { Check, Leaf, Mail, Sprout } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { Footer } from "@/components/Footer"

const CONTACT_EMAIL = "hola@surqo.co"
const CONTACT_SUBJECT = encodeURIComponent("Quiero activar el plan Pro de Surqo")
const CONTACT_BODY = encodeURIComponent(
  "Hola equipo Surqo,\n\nQuiero activar el plan Pro para mi cuenta.\n\nCorreo de mi cuenta: \nNombre de mi finca: \n\nGracias."
)

const FREE_FEATURES = [
  "1 finca",
  "Monitoreo de sensores en tiempo real",
  "KPIs agronómicos (VPD, ETc, riesgo de plagas)",
  "Alertas automáticas por email",
  "25 análisis con IA (de por vida)",
]

const PRO_FEATURES = [
  "Fincas ilimitadas",
  "Monitoreo de sensores en tiempo real",
  "KPIs agronómicos (VPD, ETc, riesgo de plagas)",
  "Alertas automáticas por email",
  "Análisis con IA ilimitados",
  "Más tokens por análisis (respuestas más detalladas)",
  "Soporte prioritario",
]

export default function UpgradePage() {
  const { planLimits, loading } = useAuth()
  const isPaid = planLimits?.plan === "paid"

  return (
    <div className="min-h-screen bg-surqo-bg">
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-20">

        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-3">
            Planes
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-surqo-text mb-4">
            Elige el plan de tu finca
          </h1>
          <p className="text-surqo-text-muted font-medium max-w-xl mx-auto">
            {loading
              ? "Cargando tu plan actual..."
              : isPaid
              ? "Ya tienes el plan Pro activo. Gracias por confiar en Surqo."
              : "Empieza gratis. Cuando tu operación crezca, escríbenos y activamos tu plan Pro en el mismo día."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Free */}
          <div className="glass rounded-2xl p-8 border border-white/[0.06] relative">
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="w-5 h-5 text-surqo-text-muted" />
              <h2 className="text-lg font-black text-surqo-text">Free</h2>
              {!isPaid && !loading && (
                <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-surqo-green-bright bg-surqo-green/10 px-2.5 py-1 rounded-full">
                  Tu plan actual
                </span>
              )}
            </div>
            <p className="text-3xl font-black text-surqo-text mb-1">$0</p>
            <p className="text-sm text-surqo-text-muted font-medium mb-7">
              Para validar Surqo en tu finca
            </p>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-surqo-text-secondary font-medium">
                  <Check className="w-4 h-4 text-surqo-text-muted shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="block text-center text-sm font-bold text-surqo-text-secondary border border-white/[0.08] rounded-xl py-3 hover:bg-white/[0.03] transition-colors"
            >
              Ir al dashboard
            </Link>
          </div>

          {/* Pro */}
          <div className="glass rounded-2xl p-8 border border-surqo-green/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-surqo-green/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-2 mb-1 relative">
              <Leaf className="w-5 h-5 text-surqo-green-bright" />
              <h2 className="text-lg font-black text-surqo-text">Pro</h2>
              {isPaid && (
                <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-surqo-green-bright bg-surqo-green/10 px-2.5 py-1 rounded-full">
                  Tu plan actual
                </span>
              )}
            </div>
            <p className="text-3xl font-black text-surqo-text mb-1 relative">
              $15–25 <span className="text-base font-bold text-surqo-text-muted">USD/mes</span>
            </p>
            <p className="text-sm text-surqo-text-muted font-medium mb-7 relative">
              Para fincas medianas y cooperativas
            </p>
            <ul className="space-y-3 mb-8 relative">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-surqo-text-secondary font-medium">
                  <Check className="w-4 h-4 text-surqo-green-bright shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {isPaid ? (
              <div className="text-center text-sm font-bold text-surqo-green-bright border border-surqo-green/30 rounded-xl py-3 relative">
                Plan activo ✓
              </div>
            ) : (
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${CONTACT_SUBJECT}&body=${CONTACT_BODY}`}
                className="flex items-center justify-center gap-2 text-sm font-bold text-surqo-bg bg-surqo-green-bright rounded-xl py-3 hover:opacity-90 transition-opacity relative"
              >
                <Mail className="w-4 h-4" />
                Escribir para activar Pro
              </a>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-surqo-text-muted font-medium">
            Hoy activamos el plan Pro manualmente al recibir tu correo — no hay pago automático todavía.{" "}
            Respondemos el mismo día hábil.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
