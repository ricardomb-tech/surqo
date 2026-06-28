import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Cpu, Brain, Bell, BarChart3 } from "lucide-react"
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

      {/* ── HERO ── */}
      <section className="relative h-[70vh] min-h-[480px] flex items-end overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=85"
            alt="Tractor en campo colombiano"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Gradiente oscuro de abajo hacia arriba para legibilidad del texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        </div>

        {/* Contenido sobre la imagen */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-16 pt-32">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#86E66A" }}>
            Soluciones
          </p>
          <h1
            className="font-black tracking-tighter text-white leading-none mb-5"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            Todo lo que necesita<br />
            <span style={{ color: "#86E66A" }}>tu finca</span>
          </h1>
          <p className="text-lg text-white/70 font-medium max-w-xl leading-relaxed">
            Cuatro módulos integrados que cubren el ciclo completo: sensores en campo, análisis con IA, alertas automáticas y visualización.
          </p>
        </div>
      </section>


      {/* ── SOLUTIONS ── */}
      <section className="relative py-20 overflow-hidden">
        {/* Imagen de fondo del agricultor */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/farmer.png"
            alt="Agricultor colombiano en campo"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 space-y-5">
          {SOLUTIONS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="rounded-3xl p-7 md:p-9 transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backdropFilter: "blur(20px) saturate(150%)",
                  WebkitBackdropFilter: "blur(20px) saturate(150%)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Icono + badge */}
                  <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:w-44 shrink-0">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: "rgba(134,230,106,0.15)",
                        border: "1px solid rgba(134,230,106,0.35)",
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: "#86E66A" }} />
                    </div>
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-lg"
                      style={{
                        color: "#86E66A",
                        background: "rgba(134,230,106,0.12)",
                        border: "1px solid rgba(134,230,106,0.25)",
                      }}
                    >
                      {s.badge}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mb-2">{s.title}</h2>
                    <p className="text-sm text-white/70 leading-relaxed font-medium mb-4">{s.description}</p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-xs text-white/65 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#86E66A" }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
      <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden">
        {/* Imagen aérea de cultivos */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpg"
            alt="Vista aérea de cultivo"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Blob blanco central */}
        <div className="relative z-10 mx-4 text-center px-10 sm:px-16 py-12 sm:py-14 max-w-lg"
          style={{
            background: "white",
            borderRadius: "62% 38% 55% 45% / 52% 48% 52% 48%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}
        >
          <h2 className="font-black leading-tight mb-3"
            style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "#1a3318" }}>
            ¿Listo para conectar<br />tu finca?
          </h2>
          <p className="font-semibold mb-7 text-sm leading-relaxed" style={{ color: "#4a7c2f" }}>
            Crea tu cuenta gratis y empieza a<br />monitorear tu cultivo en minutos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 font-black px-7 py-3 rounded-full text-sm transition-all hover:scale-105"
            style={{ border: "2px solid #3a6b1a", color: "#3a6b1a" }}
          >
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
