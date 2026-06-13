import Link from "next/link"
import { ArrowRight, Check, Zap, Lock } from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { Footer } from "@/components/Footer"

const FREE_FEATURES = [
  "1 finca registrada",
  "Análisis de IA ilimitados (Llama 3.3 70B)",
  "Dashboard en tiempo real",
  "Alertas automáticas por correo",
  "Live feed del sensor vía WebSocket",
  "Pronóstico climático de 7 días",
  "Historial de análisis completo",
  "Soporte técnico por correo",
  "Actualizaciones de firmware",
]

const PRO_FEATURES = [
  "Hasta 5 fincas",
  "Alertas por WhatsApp",
  "Reportes PDF semanales",
  "Comparativa entre fincas",
  "Prioridad de soporte",
  "Exportación de datos CSV",
  "Acceso anticipado a nuevas funciones",
  "Integraciones con sensores adicionales",
]

const COMPARE_ROWS = [
  { feature: "Fincas registradas", free: "1", pro: "5" },
  { feature: "Análisis de IA", free: "Ilimitados", pro: "Ilimitados" },
  { feature: "Dashboard en tiempo real", free: true, pro: true },
  { feature: "Alertas por correo", free: true, pro: true },
  { feature: "Alertas por WhatsApp", free: false, pro: true },
  { feature: "Reportes PDF semanales", free: false, pro: true },
  { feature: "Exportación CSV", free: false, pro: true },
  { feature: "Soporte prioritario", free: false, pro: true },
  { feature: "Live feed WebSocket", free: true, pro: true },
  { feature: "Historial de análisis", free: true, pro: true },
]

function CheckIcon({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-bold text-surqo-text">{value}</span>
  }
  if (value) return <Check className="w-4 h-4 text-surqo-green mx-auto" />
  return <span className="w-4 h-4 text-surqo-text-muted mx-auto block text-center">—</span>
}

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-surqo-bg">
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">

        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Planes</p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-5">
            Simple y<br />
            <span className="text-gradient">transparente</span>
          </h1>
          <p className="text-lg text-surqo-text-secondary font-medium max-w-xl mx-auto">
            Empieza gratis. Sin tarjeta de crédito. Sin letra pequeña.
            El plan gratuito tiene todo lo que necesitas para empezar.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">

          {/* Free */}
          <div className="glass rounded-3xl border border-surqo-green/20 p-8 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-surqo-green" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-surqo-green-bright bg-surqo-green/10 border border-surqo-green/20 px-2 py-0.5 rounded">
                  Disponible ahora
                </span>
              </div>
              <h2 className="text-2xl font-black text-surqo-text tracking-tight">Plan Gratuito</h2>
              <p className="text-sm text-surqo-text-muted font-medium mt-1">Todo lo que necesitas para comenzar</p>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-black text-surqo-text tracking-tighter">$0</span>
              <span className="text-surqo-text-muted font-medium ml-2">/ siempre</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-surqo-green mt-0.5 shrink-0" />
                  <span className="text-sm text-surqo-text-secondary font-medium">{f}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" className="w-full gap-2 h-13" asChild>
              <Link href="/register">
                Crear cuenta gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Pro — coming soon */}
          <div className="glass rounded-3xl border border-white/[0.08] p-8 flex flex-col relative overflow-hidden">
            {/* Coming soon overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center">
                <Lock className="w-6 h-6 text-surqo-text-muted" />
              </div>
              <p className="text-lg font-black text-surqo-text">Próximamente</p>
              <p className="text-sm text-surqo-text-muted font-medium text-center max-w-[200px]">
                Estamos construyendo el plan Pro. Déjanos tu correo para enterarte primero.
              </p>
              <a
                href="mailto:hola@surqo.co?subject=Quiero saber del Plan Pro"
                className="mt-2 text-xs font-bold text-surqo-green-bright hover:underline"
              >
                Notifícame cuando esté listo →
              </a>
            </div>

            <div className="mb-6 opacity-40">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-surqo-text-muted" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-surqo-text-muted bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
                  Próximamente
                </span>
              </div>
              <h2 className="text-2xl font-black text-surqo-text tracking-tight">Plan Pro</h2>
              <p className="text-sm text-surqo-text-muted font-medium mt-1">Para productores que escalan</p>
            </div>

            <div className="mb-8 opacity-40">
              <span className="text-5xl font-black text-surqo-text tracking-tighter">$--</span>
              <span className="text-surqo-text-muted font-medium ml-2">/ mes</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8 opacity-40">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-surqo-text-muted mt-0.5 shrink-0" />
                  <span className="text-sm text-surqo-text-muted font-medium">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mb-20">
          <h2 className="text-2xl font-black text-surqo-text tracking-tight text-center mb-8">
            Comparativa de planes
          </h2>

          <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 px-6 py-4 border-b border-white/[0.07] bg-white/[0.02]">
              <div className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest">Función</div>
              <div className="text-center text-xs font-bold text-surqo-green uppercase tracking-widest">Gratuito</div>
              <div className="text-center text-xs font-bold text-surqo-text-muted uppercase tracking-widest">Pro</div>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 px-6 py-4 items-center ${
                  i < COMPARE_ROWS.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                <span className="text-sm text-surqo-text-secondary font-medium">{row.feature}</span>
                <div className="text-center"><CheckIcon value={row.free} /></div>
                <div className="text-center opacity-60"><CheckIcon value={row.pro} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="glass rounded-3xl border border-surqo-green/20 p-10 text-center">
          <h2 className="text-3xl font-black tracking-tighter mb-3">
            Empieza ahora, gratis
          </h2>
          <p className="text-surqo-text-secondary font-medium mb-8 max-w-md mx-auto">
            Sin compromisos. Sin tarjeta. Cancela cuando quieras (aunque nunca querrás).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gap-2 h-13" asChild>
              <Link href="/register">
                Crear cuenta gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-13" asChild>
              <Link href="/">Ver cómo funciona</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
