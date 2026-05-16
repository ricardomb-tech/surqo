"use client"

import Link from "next/link"
import { CheckCircle2, XCircle, CrownIcon, Zap, Mail } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { Button, Card } from "@/components/ui/Primitives"

const FREE_FEATURES = [
  { label: "Hasta 3 fincas", ok: true },
  { label: "Sensores en tiempo real", ok: true },
  { label: "Alertas básicas (10/mes)", ok: true },
  { label: "Análisis IA con Claude", ok: false },
  { label: "Alertas email ilimitadas", ok: false },
  { label: "Fincas ilimitadas", ok: false },
]

const PRO_FEATURES = [
  { label: "Fincas ilimitadas", ok: true },
  { label: "Sensores en tiempo real", ok: true },
  { label: "Alertas email ilimitadas", ok: true },
  { label: "Análisis IA con Claude", ok: true },
  { label: "Soporte prioritario", ok: true },
  { label: "Historial completo", ok: true },
]

export default function UpgradePage() {
  const { isPaid, planLimits } = useAuth()

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 text-xs font-bold text-amber-400 mb-8">
            <CrownIcon className="w-3.5 h-3.5" />
            Plan Pro
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
            Desbloquea todo el <span className="text-gradient">potencial</span>
          </h1>
          <p className="text-surqo-text-secondary font-medium max-w-xl mx-auto">
            Análisis IA ilimitado, alertas sin restricciones y fincas sin límite para que tu operación crezca sin barreras.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Free */}
          <Card className={`relative ${!isPaid ? "border-surqo-green/30 shadow-glow-sm" : ""}`}>
            {!isPaid && (
              <div className="absolute -top-3 left-6 bg-surqo-green text-white text-xs font-bold px-3 py-1 rounded-full">
                Plan actual
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-surqo-text-secondary" />
              <h2 className="text-xl font-black text-surqo-text">Gratuito</h2>
            </div>
            <p className="text-3xl font-black text-surqo-text mb-1">$0</p>
            <p className="text-xs text-surqo-text-muted mb-6">Para siempre</p>

            {!isPaid && planLimits && (
              <div className="bg-surqo-bg-surface/50 rounded-2xl p-3 mb-6 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-surqo-text-muted">Fincas</span>
                  <span className="font-bold text-surqo-text">{planLimits.farms.used} / {planLimits.farms.limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surqo-text-muted">Alertas email este mes</span>
                  <span className="font-bold text-surqo-text">{planLimits.email_alerts.used} / {planLimits.email_alerts.limit}</span>
                </div>
              </div>
            )}

            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm">
                  {f.ok
                    ? <CheckCircle2 className="w-4 h-4 text-surqo-green shrink-0" />
                    : <XCircle className="w-4 h-4 text-surqo-text-muted shrink-0" />}
                  <span className={f.ok ? "text-surqo-text font-medium" : "text-surqo-text-muted line-through"}>{f.label}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Pro */}
          <Card className={`relative border-amber-500/30 ${isPaid ? "shadow-glow-sm" : ""}`}>
            {isPaid && (
              <div className="absolute -top-3 left-6 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Plan actual
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <CrownIcon className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-surqo-text">Pro</h2>
            </div>
            <p className="text-3xl font-black text-amber-400 mb-1">Contactar</p>
            <p className="text-xs text-surqo-text-muted mb-6">Precio según necesidad</p>

            <ul className="space-y-3 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-surqo-text font-medium">{f.label}</span>
                </li>
              ))}
            </ul>

            {!isPaid && (
              <a
                href="mailto:rickmartinezbanda@gmail.com?subject=Surqo%20Pro%20-%20Actualizar%20plan"
                className="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-2xl font-bold text-sm bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
              >
                <Mail className="w-4 h-4" />
                Contactar para actualizar
              </a>
            )}

            {isPaid && (
              <div className="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-2xl font-bold text-sm bg-surqo-green/10 text-surqo-green-bright border border-surqo-green/20">
                <CheckCircle2 className="w-4 h-4" />
                Plan activo
              </div>
            )}
          </Card>
        </div>

        <p className="text-center text-sm text-surqo-text-muted">
          ¿Tienes preguntas?{" "}
          <a href="mailto:rickmartinezbanda@gmail.com" className="text-surqo-green-bright font-bold hover:underline">
            Escríbenos
          </a>
        </p>
      </div>
    </div>
  )
}
