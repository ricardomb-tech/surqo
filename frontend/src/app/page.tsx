import Link from "next/link"
import { ArrowRight, Zap, Cpu, Brain, Bell, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { Footer } from "@/components/Footer"

const HIGHLIGHTS = [
  { icon: Cpu,       label: "Sensores IoT",       sub: "ESP32 + DHT22 en campo real" },
  { icon: Brain,     label: "IA Agronómica",       sub: "Llama 3.3 70B · análisis en español" },
  { icon: Bell,      label: "Alertas en tiempo real", sub: "Estrés hídrico, plagas, temperaturas" },
  { icon: BarChart3, label: "Dashboard 24/7",      sub: "VPD, ETc, humedad, historial" },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── HERO ── */}
      <section className="relative flex-1 flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.07] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 py-28 relative z-10 text-center w-full">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-surqo-green/10 border border-surqo-green/20 rounded-full px-4 py-2 text-xs font-bold text-surqo-green-bright mb-10">
            <span className="live-dot" />
            <span className="tracking-widest uppercase">Piloto activo · Córdoba, Colombia</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl sm:text-8xl lg:text-[100px] font-black tracking-tighter mb-6 leading-[0.85]">
            Del surco al <br />
            <span className="text-gradient">insight.</span>
          </h1>

          {/* Sub */}
          <p className="text-lg sm:text-xl text-surqo-text-secondary max-w-xl mx-auto mb-4 leading-relaxed font-medium">
            Inteligencia agroclimática para el campo colombiano.
            IoT + IA que convierte datos del suelo en decisiones concretas.
          </p>
          <p className="text-xs text-surqo-text-muted font-medium mb-12 tracking-widest uppercase">
            100 % gratuito · Sin tarjeta · Sin letra pequeña
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Button size="lg" className="h-14 px-10 text-base rounded-2xl group" asChild>
              <Link href="/register">
                Empieza gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-2xl" asChild>
              <Link href="/soluciones">Ver qué hace Surqo</Link>
            </Button>
          </div>

          {/* 4 pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {HIGHLIGHTS.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="glass rounded-2xl border border-white/[0.07] p-4 text-left hover:border-surqo-green/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-black text-surqo-text leading-tight mb-1">{label}</p>
                <p className="text-[11px] text-surqo-text-muted font-medium leading-tight">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MINI CTA strip ── */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-surqo-green shrink-0" />
            <p className="text-sm text-surqo-text-secondary font-medium">
              ¿Quieres saber cómo funciona antes de crear tu cuenta?
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/como-funciona" className="text-sm font-bold text-surqo-green-bright hover:underline">
              Cómo funciona →
            </Link>
            <span className="text-surqo-text-muted text-xs">·</span>
            <Link href="/preguntas" className="text-sm font-bold text-surqo-text-secondary hover:text-surqo-green transition-colors">
              Preguntas frecuentes
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
