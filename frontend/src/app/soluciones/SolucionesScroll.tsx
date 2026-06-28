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
      "Nodos ESP32 con sensores DHT22 (temperatura + humedad del aire) y sensor capacitivo de suelo. Lecturas cada 15 minutos enviadas vía MQTT TLS directamente desde tu finca.",
    points: ["Temperatura y humedad del aire", "Humedad y temperatura del suelo", "Índice UV y batería del nodo", "Deep sleep para durar semanas"],
  },
  {
    icon: Brain,
    badge: "Inteligencia Artificial",
    title: "Análisis agronómico con IA",
    description:
      "Llama 3.3 70B analiza el pronóstico climático de 7 días junto con el estado actual del suelo y genera recomendaciones específicas para tu cultivo en español claro.",
    points: ["Pronóstico climático de 7 días (Open-Meteo)", "Índice de estrés hídrico", "Recomendación de riego y fertilización", "Evaluación de riesgo de plagas"],
  },
  {
    icon: Bell,
    badge: "Alertas",
    title: "Alertas antes de que sea tarde",
    description:
      "El sistema detecta automáticamente condiciones críticas y te notifica por correo electrónico antes de que el cultivo sufra daños.",
    points: ["Estrés hídrico detectado", "Temperatura fuera de rango", "Humedad peligrosa para hongos", "Historial completo de alertas"],
  },
  {
    icon: BarChart3,
    badge: "Dashboard",
    title: "Todo en un panel",
    description:
      "Dashboard profesional con KPIs en tiempo real, gráficas de evolución y acceso al historial completo de análisis desde cualquier dispositivo.",
    points: ["VPD y ETc en tiempo real", "Gráfica de humedad histórica", "Últimos análisis con IA", "Estado del suelo y salud del cultivo"],
  },
]

// ── Individual card driven by scroll ────────────────────────────────────────

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

  // Each card occupies 1/total of the scroll range
  const start = index / total
  const end = (index + 1) / total
  const mid = (start + end) / 2

  // Enter: [start, mid] — Exit: [mid, end]
  const rawOpacity = useTransform(
    scrollYProgress,
    [start, start + 0.08, mid + 0.08, end],
    [0, 1, 1, 0]
  )
  const rawY = useTransform(
    scrollYProgress,
    [start, start + 0.12, mid + 0.08, end],
    [60, 0, 0, -60]
  )
  const rawScale = useTransform(
    scrollYProgress,
    [start, start + 0.12, mid + 0.08, end],
    [0.92, 1, 1, 0.94]
  )
  const rawBlur = useTransform(
    scrollYProgress,
    [start, start + 0.1, mid + 0.06, end],
    [8, 0, 0, 6]
  )

  // Spring physics for buttery smoothness
  const opacity = useSpring(rawOpacity, { stiffness: 120, damping: 20 })
  const y       = useSpring(rawY,       { stiffness: 120, damping: 20 })
  const scale   = useSpring(rawScale,   { stiffness: 120, damping: 20 })

  // Progress bar fill for this card
  const barFill = useTransform(scrollYProgress, [start, end], [0, 1])
  const barWidth = useTransform(barFill, (v) => `${Math.min(v, 1) * 100}%`)

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, y, scale, filter: useTransform(rawBlur, (b) => `blur(${b}px)`) }}
    >
      {/* Progress bar for this card */}
      <div className="flex gap-2 mb-8">
        {SOLUTIONS.map((_, i) => (
          <div key={i} className="h-1 rounded-full flex-1 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.18)" }}>
            {i === index && (
              <motion.div className="h-full rounded-full" style={{ width: barWidth, background: LIME }} />
            )}
            {i < index && (
              <div className="h-full rounded-full w-full" style={{ background: LIME }} />
            )}
          </div>
        ))}
      </div>

      {/* Glass card */}
      <div
        className="rounded-3xl p-6 sm:p-8 h-full"
        style={{
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.22)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
        }}
      >
        <div className="flex flex-col sm:flex-row gap-6 h-full">
          {/* Icon + badge */}
          <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:w-44 shrink-0">
            <motion.div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(134,230,106,0.15)", border: "1px solid rgba(134,230,106,0.35)" }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Icon className="w-7 h-7" style={{ color: LIME }} />
            </motion.div>
            <span
              className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-lg"
              style={{ color: LIME, background: "rgba(134,230,106,0.12)", border: "1px solid rgba(134,230,106,0.25)" }}
            >
              {solution.badge}
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
              {solution.title}
            </h2>
            <p className="text-sm text-white/70 leading-relaxed font-medium mb-4">
              {solution.description}
            </p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {solution.points.map((p, pi) => (
                <motion.li
                  key={p}
                  className="flex items-center gap-2 text-xs text-white/65 font-medium"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pi * 0.07, duration: 0.35, ease: "easeOut" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: LIME }} />
                  {p}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function SolucionesScroll() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Smooth spring on master progress
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 22 })

  // "Desliza" hint fades out after first card
  const hintOpacity = useTransform(smoothProgress, [0, 1 / SOLUTIONS.length], [1, 0])

  return (
    <div ref={containerRef} style={{ height: `${(SOLUTIONS.length + 1) * 100}vh` }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: "100vh" }}>

        {/* Background fixed */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/campesino.png.jpg"
            alt="Agricultor colombiano"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        {/* Cards area */}
        <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-8 max-w-3xl mx-auto">
          <div className="relative" style={{ height: "380px" }}>
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

          {/* Scroll hint */}
          <motion.p
            className="text-white/35 text-xs text-center mt-6 font-medium tracking-widest uppercase"
            style={{ opacity: hintOpacity }}
          >
            Desliza para ver más
          </motion.p>
        </div>
      </div>
    </div>
  )
}
