"use client"

import { useRef } from "react"
import Image from "next/image"
import { Cpu, Brain, Bell, BarChart3 } from "lucide-react"
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion"

const LIME = "#86E66A"

const SOLUTIONS = [
  {
    icon: Cpu,
    badge: "IoT",
    title: "Sensores en campo real",
    description:
      "Nodos ESP32 con sensores DHT22 y sensor capacitivo de suelo. Lecturas cada 15 minutos enviadas vía MQTT TLS directamente desde tu finca.",
    points: ["Temperatura y humedad del aire", "Humedad y temperatura del suelo", "Índice UV y batería del nodo", "Deep sleep para durar semanas"],
  },
  {
    icon: Brain,
    badge: "Inteligencia Artificial",
    title: "Análisis agronómico con IA",
    description:
      "Llama 3.3 70B analiza el pronóstico climático de 7 días y genera recomendaciones específicas para tu cultivo en español claro.",
    points: ["Pronóstico climático de 7 días", "Índice de estrés hídrico", "Recomendación de riego y fertilización", "Evaluación de riesgo de plagas"],
  },
  {
    icon: Bell,
    badge: "Alertas",
    title: "Alertas antes de que sea tarde",
    description:
      "El sistema detecta condiciones críticas automáticamente y te notifica por correo antes de que el cultivo sufra daños.",
    points: ["Estrés hídrico detectado", "Temperatura fuera de rango", "Humedad peligrosa para hongos", "Historial completo de alertas"],
  },
  {
    icon: BarChart3,
    badge: "Dashboard",
    title: "Todo en un panel",
    description:
      "Dashboard con KPIs en tiempo real, gráficas de evolución e historial completo de análisis desde cualquier dispositivo.",
    points: ["VPD y ETc en tiempo real", "Gráfica de humedad histórica", "Últimos análisis con IA", "Estado del suelo y salud del cultivo"],
  },
]

// ── Single card ──────────────────────────────────────────────────────────────

function SolutionCard({
  solution,
  index,
  total,
  scrollYProgress,
}: {
  solution: (typeof SOLUTIONS)[0]
  index: number
  total: number
  scrollYProgress: MotionValue<number>
}) {
  const Icon = solution.icon
  const start = index / total
  const end = (index + 1) / total

  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.1, end - 0.1, end],
    [0, 1, 1, 0]
  )
  const y = useTransform(
    scrollYProgress,
    [start, start + 0.14, end - 0.1, end],
    [50, 0, 0, -50]
  )
  const scale = useTransform(
    scrollYProgress,
    [start, start + 0.14, end - 0.1, end],
    [0.94, 1, 1, 0.96]
  )

  const sOpacity = useSpring(opacity, { stiffness: 100, damping: 22 })
  const sY      = useSpring(y,       { stiffness: 100, damping: 22 })
  const sScale  = useSpring(scale,   { stiffness: 100, damping: 22 })

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity: sOpacity, y: sY, scale: sScale }}
    >
      {/* Glass card — white frosted */}
      <div
        className="w-full h-full rounded-3xl p-7 sm:p-10 flex flex-col sm:flex-row gap-7 sm:gap-10"
        style={{
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          boxShadow: "0 16px 56px rgba(0,0,0,0.28)",
        }}
      >
        {/* Left: icon + badge */}
        <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-5 shrink-0 sm:w-44">
          <motion.div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(134,230,106,0.18)", border: "2px solid rgba(134,230,106,0.45)" }}
            whileHover={{ scale: 1.08, rotate: 4 }}
            transition={{ type: "spring", stiffness: 280, damping: 14 }}
          >
            <Icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: "#2d7a1f" }} />
          </motion.div>
          <span
            className="text-[11px] sm:text-xs font-black tracking-widest uppercase px-3 py-1.5 rounded-lg"
            style={{ color: "#fff", background: "#3a8a22", letterSpacing: "0.1em" }}
          >
            {solution.badge}
          </span>
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="font-black tracking-tight mb-3 leading-tight"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", color: "#1a3318" }}>
            {solution.title}
          </h2>
          <p className="leading-relaxed font-bold mb-6"
            style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.05rem)", color: "#2a4a20" }}>
            {solution.description}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {solution.points.map((p) => (
              <li key={p} className="flex items-center gap-2.5 font-semibold"
                style={{ fontSize: "clamp(0.8rem, 1.3vw, 0.92rem)", color: "#3a5a2a" }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#3a8a22" }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

// ── Progress bar — own component to follow Rules of Hooks ───────────────────

function ProgressBar({
  index,
  total,
  scrollYProgress,
}: {
  index: number
  total: number
  scrollYProgress: MotionValue<number>
}) {
  const width = useTransform(
    scrollYProgress,
    [index / total, (index + 1) / total],
    ["0%", "100%"]
  )
  return (
    <div className="h-[3px] rounded-full flex-1 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.15)" }}>
      <motion.div className="h-full rounded-full" style={{ width, background: LIME }} />
    </div>
  )
}

// ── Hint opacity — own component ─────────────────────────────────────────────

function ScrollHint({ scrollYProgress, total }: { scrollYProgress: MotionValue<number>; total: number }) {
  const opacity = useTransform(scrollYProgress, [0, 1 / total], [1, 0])
  return (
    <motion.p
      className="text-white/30 text-xs text-center mt-6 font-semibold tracking-widest uppercase"
      style={{ opacity }}
    >
      Desliza para ver más
    </motion.p>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function SolucionesScroll() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 22 })

  return (
    <div ref={containerRef} style={{ height: `${(SOLUTIONS.length + 1) * 100}vh` }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: "100vh" }}>

        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/campesino.png.jpg"
            alt="Agricultor colombiano"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/58" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-10 lg:px-16 max-w-5xl mx-auto w-full">

          {/* Progress bars */}
          <div className="flex gap-2 mb-8">
            {SOLUTIONS.map((_, i) => (
              <ProgressBar key={i} index={i} total={SOLUTIONS.length} scrollYProgress={smoothProgress} />
            ))}
          </div>

          {/* Card stack */}
          <div className="relative w-full" style={{ height: "clamp(280px, 45vh, 420px)" }}>
            {SOLUTIONS.map((s, i) => (
              <SolutionCard
                key={s.title}
                solution={s}
                index={i}
                total={SOLUTIONS.length}
                scrollYProgress={smoothProgress}
              />
            ))}
          </div>

          <ScrollHint scrollYProgress={smoothProgress} total={SOLUTIONS.length} />
        </div>
      </div>
    </div>
  )
}
