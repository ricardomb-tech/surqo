"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight, Zap, Cpu, Brain, Bell, BarChart3,
  Droplets, Thermometer, Wind, ChevronDown, CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { Footer } from "@/components/Footer"

// ── DATA ─────────────────────────────────────────────────────────────────────

const SOLUTIONS = [
  {
    icon: Cpu,
    badge: "IoT",
    title: "Sensores en campo real",
    description:
      "Nodos ESP32 con sensores de temperatura, humedad de suelo y aire. Datos cada 15 minutos, directamente desde tu cultivo.",
  },
  {
    icon: Brain,
    badge: "Inteligencia Artificial",
    title: "Análisis agronómico con IA",
    description:
      "Llama 3.3 70B analiza el clima de 7 días, el estado del suelo y te dice exactamente cuándo y cuánto regar, fertilizar o actuar.",
  },
  {
    icon: Bell,
    badge: "Alertas",
    title: "Alertas antes de que sea tarde",
    description:
      "Detectamos estrés hídrico, riesgo de plagas y condiciones críticas. Te avisamos por email en tiempo real antes de que pierdas la cosecha.",
  },
  {
    icon: BarChart3,
    badge: "Dashboard",
    title: "Todo en un panel",
    description:
      "VPD, ETc, humedad de suelo, temperatura y análisis histórico. Un dashboard profesional accesible desde cualquier dispositivo.",
  },
]

const STEPS = [
  {
    number: "01",
    title: "Instala el nodo",
    description: "Conecta el Surqo Node en tu finca. WiFi o 4G. Empieza a recibir datos en minutos.",
  },
  {
    number: "02",
    title: "La IA analiza",
    description: "Combinamos tus datos del suelo con el pronóstico climático de 7 días para generar recomendaciones precisas.",
  },
  {
    number: "03",
    title: "Tú decides",
    description: "Recibe el análisis en tu dashboard. Cuándo regar, cuánto fertilizar, qué riesgo hay esta semana.",
  },
]

const METRICS = [
  { icon: Droplets, value: "45%", label: "Ahorro de agua" },
  { icon: Thermometer, value: "±0.5°C", label: "Precisión temperatura" },
  { icon: Wind, value: "1.2 kPa", label: "VPD en tiempo real" },
  { icon: BarChart3, value: "24/7", label: "Monitoreo continuo" },
]

const SOCIAL_PROOF = [
  {
    quote: "Con Surqo ahorramos agua y llegamos a la cosecha con el cultivo en mejor estado. Antes adivinábamos cuándo regar.",
    author: "Productor de maíz",
    location: "Montería, Córdoba",
    crop: "Maíz",
  },
  {
    quote: "El análisis de IA me dice exactamente qué hacer esa semana. Es como tener un agrónomo que trabaja los 7 días.",
    author: "Agricultora",
    location: "Cereté, Córdoba",
    crop: "Yuca",
  },
  {
    quote: "Instalé el sensor en 20 minutos. Al día siguiente ya tenía datos del suelo de mi finca en el teléfono.",
    author: "Productor familiar",
    location: "Sahagún, Córdoba",
    crop: "Ñame",
  },
]

const FAQS = [
  {
    q: "¿Cuánto cuesta Surqo?",
    a: "Surqo es completamente gratuito. No hay planes de pago, no hay tarjeta de crédito, no hay letra pequeña. Es una solución abierta para el agricultor colombiano.",
  },
  {
    q: "¿Qué hardware necesito para empezar?",
    a: "Necesitas un microcontrolador ESP32 (≈ $8 USD), sensores DHT22 (temperatura/humedad) y un sensor capacitivo de humedad de suelo (≈ $3 USD). El firmware lo flasheas gratis desde el repositorio. También puedes usar el simulador sin hardware para probar la plataforma.",
  },
  {
    q: "¿Funciona sin internet en la finca?",
    a: "El nodo ESP32 necesita WiFi o un punto de acceso 4G/LTE para enviar datos. El consumo de datos es mínimo (menos de 5 MB/mes). El nodo entra en deep sleep entre lecturas, por lo que una batería de 3000 mAh puede durar semanas.",
  },
  {
    q: "¿Cómo funciona el análisis con IA?",
    a: "Combinamos tus datos del sensor (temperatura, humedad de suelo, VPD) con el pronóstico climático de 7 días de Open-Meteo para tu ubicación GPS exacta. El modelo Llama 3.3 70B genera recomendaciones agronómicas específicas para tu cultivo en español claro.",
  },
  {
    q: "¿Puedo probar Surqo sin tener hardware?",
    a: "Sí. Tenemos un simulador de Python que genera lecturas realistas de sensores vía MQTT. Puedes crear una cuenta, registrar tu finca y simular datos en minutos sin comprar ningún componente.",
  },
  {
    q: "¿Mis datos son privados y seguros?",
    a: "Sí. Toda la autenticación es vía Supabase con JWT. Los datos de tu finca son exclusivamente tuyos y nunca se comparten con terceros. La comunicación MQTT usa TLS en el puerto 8883 y la API usa HTTPS en todo momento.",
  },
  {
    q: "¿En qué regiones de Colombia funciona?",
    a: "Surqo funciona en cualquier lugar de Colombia con cobertura a internet. El pronóstico climático viene de Open-Meteo, que cubre todo el territorio nacional. Actualmente el piloto activo está en Córdoba, pero cualquier agricultor colombiano puede registrarse.",
  },
  {
    q: "¿Necesito conocimientos técnicos para instalarlo?",
    a: "El proceso está diseñado para ser simple: editas un archivo config.h con tus datos de WiFi y finca, flasheas el firmware con PlatformIO (un clic) y conectas el sensor. La guía paso a paso está en la plataforma. Si prefieres, también puedes usar el simulador.",
  },
]

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className="font-bold text-surqo-text text-sm group-hover:text-surqo-green transition-colors">
          {q}
        </span>
        <ChevronDown className={`w-4 h-4 text-surqo-text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-white/[0.05]">
          <p className="text-sm text-surqo-text-secondary font-medium leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-28 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-surqo-green/10 border border-surqo-green/20 rounded-full px-4 py-2 text-xs font-bold text-surqo-green-bright mb-8 shadow-inner-glow">
            <span className="live-dot" />
            <span className="tracking-widest uppercase">Piloto activo · Córdoba, Colombia</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.85]">
            Del surco al <br />
            <span className="text-gradient">insight.</span>
          </h1>

          <p className="text-lg sm:text-xl text-surqo-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Impulsamos la agricultura colombiana con inteligencia de datos real.
            Conecta tus cultivos, optimiza tus recursos, maximiza tu cosecha.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="h-14 px-10 text-base rounded-2xl group" asChild>
              <Link href="/register">
                Empieza gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-2xl" asChild>
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
          <p className="text-xs text-surqo-text-muted font-medium mt-5">
            100% gratuito · Sin tarjeta de crédito · Sin letra pequeña
          </p>
        </div>
      </section>

      {/* ── MÉTRICAS ── */}
      <section className="border-y border-black/5 dark:border-white/5 bg-surqo-bg-surface/30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {METRICS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-surqo-green/10 flex items-center justify-center text-surqo-green mx-auto mb-3 border border-surqo-green/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-gradient mb-1">{value}</div>
                <div className="text-xs font-bold text-surqo-text-muted tracking-widest uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUCIONES ── */}
      <section className="max-w-5xl mx-auto px-4 py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Soluciones</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
            Todo lo que necesita<br />
            <span className="text-gradient">tu finca</span>
          </h2>
          <p className="text-surqo-text-secondary font-medium max-w-lg mx-auto">
            Diseñado para los desafíos reales del campo colombiano: clima tropical, conectividad limitada y decisiones urgentes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {SOLUTIONS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="glass rounded-2xl border border-white/[0.07] p-8 group hover:border-surqo-green/20 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-surqo-green-bright bg-surqo-green/10 border border-surqo-green/20 px-2 py-0.5 rounded-md">
                      {s.badge}
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-surqo-text mt-2 mb-2">{s.title}</h3>
                    <p className="text-sm text-surqo-text-secondary leading-relaxed font-medium">{s.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="border-t border-black/5 dark:border-white/5 bg-surqo-bg-surface/20">
        <div className="max-w-5xl mx-auto px-4 py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Proceso</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">
              Tres pasos para<br />
              <span className="text-gradient">transformar tu finca</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="text-6xl font-black text-surqo-green/10 mb-4 leading-none">{step.number}</div>
                <h3 className="text-xl font-black tracking-tight text-surqo-text mb-3">{step.title}</h3>
                <p className="text-sm text-surqo-text-secondary leading-relaxed font-medium">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="max-w-5xl mx-auto px-4 py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Agricultores</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">
            Lo que dicen los que<br />
            <span className="text-gradient">ya lo usan</span>
          </h2>
          <p className="text-surqo-text-secondary font-medium max-w-md mx-auto mt-4">
            Piloto activo con productores en el departamento de Córdoba.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {SOCIAL_PROOF.map((t, i) => (
            <div key={i} className="glass rounded-2xl border border-white/[0.07] p-6 flex flex-col gap-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="text-surqo-green text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-surqo-text-secondary leading-relaxed font-medium flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-white/[0.06] pt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-xs font-black text-surqo-green shrink-0">
                  {t.author[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-surqo-text">{t.author}</p>
                  <p className="text-[11px] text-surqo-text-muted font-medium">{t.location} · {t.crop}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-black/5 dark:border-white/5 bg-surqo-bg-surface/20">
        <div className="max-w-3xl mx-auto px-4 py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Preguntas frecuentes</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
              Todo lo que necesitas<br />
              <span className="text-gradient">saber</span>
            </h2>
            <p className="text-surqo-text-secondary font-medium max-w-md mx-auto">
              ¿Tienes dudas? Aquí respondemos las más comunes. Si necesitas más ayuda escríbenos.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-surqo-text-secondary font-medium">
              ¿Tienes otra pregunta?{" "}
              <a href="mailto:hola@surqo.co" className="text-surqo-green-bright font-bold hover:underline">
                Escríbenos a hola@surqo.co
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-4 py-28">
        <div className="glass rounded-3xl border border-surqo-green/20 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-surqo-green/10 border border-surqo-green/20 rounded-full px-4 py-2 text-xs font-bold text-surqo-green-bright mb-6">
              <Zap className="w-3.5 h-3.5" />
              100% gratuito · Siempre
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
              Tu finca inteligente<br />
              <span className="text-gradient">te está esperando</span>
            </h2>
            <p className="text-surqo-text-secondary font-medium mb-10 max-w-lg mx-auto">
              Crea tu cuenta gratis, registra tu finca y empieza a recibir análisis agronómicos
              con IA en menos de 5 minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="h-14 px-12 text-base rounded-2xl group" asChild>
                <Link href="/register">
                  Crear cuenta gratis
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-2xl" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
