import Link from "next/link"
import { ArrowRight, Cpu, Brain, Bell, BarChart3, Droplets, Thermometer, Wind, Zap } from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { Footer } from "@/components/Footer"

const SOLUTIONS = [
  {
    icon: Cpu,
    badge: "IoT",
    color: "surqo-green",
    title: "Sensores en campo real",
    description:
      "Nodos ESP32 con sensores DHT22 (temperatura + humedad del aire) y sensor capacitivo de suelo. Lecturas cada 15 minutos enviadas vía MQTT TLS directamente desde tu finca.",
    points: ["Temperatura y humedad del aire", "Humedad y temperatura del suelo", "Índice UV y batería del nodo", "Deep sleep para durar semanas"],
  },
  {
    icon: Brain,
    badge: "Inteligencia Artificial",
    color: "surqo-sky",
    title: "Análisis agronómico con IA",
    description:
      "Llama 3.3 70B analiza el pronóstico climático de 7 días junto con el estado actual del suelo y genera recomendaciones específicas para tu cultivo en español claro.",
    points: ["Pronóstico climático de 7 días (Open-Meteo)", "Índice de estrés hídrico", "Recomendación de riego y fertilización", "Evaluación de riesgo de plagas"],
  },
  {
    icon: Bell,
    badge: "Alertas",
    color: "surqo-warning",
    title: "Alertas antes de que sea tarde",
    description:
      "El sistema detecta automáticamente condiciones críticas y te notifica por correo electrónico antes de que el cultivo sufra daños.",
    points: ["Estrés hídrico detectado", "Temperatura fuera de rango", "Humedad peligrosa para hongos", "Historial completo de alertas"],
  },
  {
    icon: BarChart3,
    badge: "Dashboard",
    color: "surqo-green",
    title: "Todo en un panel",
    description:
      "Dashboard profesional con KPIs en tiempo real, gráficas de evolución y acceso al historial completo de análisis desde cualquier dispositivo.",
    points: ["VPD y ETc en tiempo real", "Gráfica de humedad histórica", "Últimos análisis con IA", "Estado del suelo y salud del cultivo"],
  },
]

const METRICS = [
  { icon: Droplets, value: "45%", label: "Ahorro promedio de agua" },
  { icon: Thermometer, value: "±0.5°C", label: "Precisión de temperatura" },
  { icon: Wind, value: "1.2 kPa", label: "Resolución VPD" },
  { icon: Zap, value: "15 min", label: "Frecuencia de lectura" },
]

const TESTIMONIALS = [
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

export default function SolucionesPage() {
  return (
    <div className="min-h-screen bg-surqo-bg">

      {/* ── HEADER ── */}
      <section className="pt-28 pb-16 text-center max-w-3xl mx-auto px-4">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Soluciones</p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-5">
          Todo lo que necesita<br />
          <span className="text-gradient">tu finca</span>
        </h1>
        <p className="text-lg text-surqo-text-secondary font-medium max-w-xl mx-auto">
          Cuatro módulos integrados que cubren el ciclo completo: sensores en campo, análisis con IA, alertas automáticas y visualización.
        </p>
      </section>

      {/* ── METRICS ── */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {METRICS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-gradient mb-1">{value}</div>
                <div className="text-xs font-bold text-surqo-text-muted tracking-widest uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section className="max-w-5xl mx-auto px-4 py-20 space-y-6">
        {SOLUTIONS.map((s, i) => {
          const Icon = s.icon
          const isEven = i % 2 === 0
          return (
            <div
              key={s.title}
              className="glass rounded-3xl border border-white/[0.07] hover:border-surqo-green/20 transition-all duration-300 p-8 md:p-10"
            >
              <div className={`flex flex-col md:flex-row gap-8 ${isEven ? "" : "md:flex-row-reverse"}`}>
                {/* Icon + badge */}
                <div className="flex flex-col items-start gap-4 md:w-56 shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-surqo-green-bright bg-surqo-green/10 border border-surqo-green/20 px-3 py-1 rounded-lg">
                    {s.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black tracking-tight text-surqo-text mb-3">{s.title}</h2>
                  <p className="text-sm text-surqo-text-secondary leading-relaxed font-medium mb-5">{s.description}</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-xs text-surqo-text-secondary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-surqo-green shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Agricultores</p>
            <h2 className="text-4xl font-black tracking-tighter">
              Lo que dicen los que<br />
              <span className="text-gradient">ya lo usan</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass rounded-2xl border border-white/[0.07] p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
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
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="glass rounded-3xl border border-surqo-green/20 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-15 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tighter mb-3">¿Listo para conectar tu finca?</h2>
            <p className="text-surqo-text-secondary font-medium mb-8 max-w-md mx-auto">
              Crea tu cuenta gratis y empieza a monitorear tu cultivo en minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/register">
                  Crear cuenta gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/como-funciona">Ver cómo funciona</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
