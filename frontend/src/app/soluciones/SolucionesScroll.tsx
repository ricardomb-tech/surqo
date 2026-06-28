"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { Cpu, Brain, Bell, BarChart3 } from "lucide-react"

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

export function SolucionesScroll() {
  const solutions = SOLUTIONS
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0) // 0 to N (float)

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const scrolled = Math.max(0, -rect.top)
      const progress = Math.min(solutions.length, (scrolled / scrollable) * solutions.length)
      setScrollProgress(progress)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [solutions.length])

  const currentIndex = Math.min(Math.floor(scrollProgress), solutions.length - 1)
  const fraction = scrollProgress - Math.floor(scrollProgress) // 0–1 dentro del slot actual

  return (
    // Altura = (N+1)*100vh — da 100vh de scroll por card
    <div ref={containerRef} style={{ height: `${(solutions.length + 1) * 100}vh` }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: "100vh" }}>

        {/* Imagen de fondo fija */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/campesino.png.jpg"
            alt="Agricultor colombiano"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-8 max-w-3xl mx-auto">

          {/* Indicador de progreso (barras) */}
          <div className="flex gap-2 mb-8">
            {solutions.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full flex-1 transition-all duration-300"
                style={{ background: i <= currentIndex ? LIME : "rgba(255,255,255,0.20)" }}
              />
            ))}
          </div>

          {/* Área de cards — posición relativa para apilar absolutas */}
          <div className="relative" style={{ height: "340px" }}>
            {solutions.map((s, i) => {
              const Icon = s.icon

              // Calcular posición y opacidad de cada card
              let translateY = 0
              let opacity = 0

              if (i === currentIndex) {
                // Card activa: visible, sale hacia arriba al final del slot
                const exitAt = 0.65
                if (fraction <= exitAt) {
                  translateY = 0
                  opacity = 1
                } else {
                  const ex = (fraction - exitAt) / (1 - exitAt)
                  translateY = -ex * 60
                  opacity = 1 - ex
                }
              } else if (i === currentIndex + 1) {
                // Siguiente card: entra desde abajo en la segunda mitad del slot
                const enterAt = 0.45
                if (fraction < enterAt) {
                  translateY = 70
                  opacity = 0
                } else {
                  const en = (fraction - enterAt) / (1 - enterAt)
                  translateY = (1 - en) * 70
                  opacity = en
                }
              } else if (i < currentIndex) {
                // Cards pasadas: ocultas arriba
                translateY = -60
                opacity = 0
              } else {
                // Cards futuras: ocultas abajo
                translateY = 70
                opacity = 0
              }

              return (
                <div
                  key={s.title}
                  className="absolute inset-0 rounded-3xl p-6 sm:p-8"
                  style={{
                    transform: `translateY(${translateY}px)`,
                    opacity,
                    willChange: "transform, opacity",
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    backdropFilter: "blur(20px) saturate(150%)",
                    WebkitBackdropFilter: "blur(20px) saturate(150%)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row gap-6 h-full">
                    {/* Icono + badge */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:w-44 shrink-0">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          background: "rgba(134,230,106,0.15)",
                          border: "1px solid rgba(134,230,106,0.35)",
                        }}
                      >
                        <Icon className="w-7 h-7" style={{ color: LIME }} />
                      </div>
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-lg"
                        style={{
                          color: LIME,
                          background: "rgba(134,230,106,0.12)",
                          border: "1px solid rgba(134,230,106,0.25)",
                        }}
                      >
                        {s.badge}
                      </span>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
                        {s.title}
                      </h2>
                      <p className="text-sm text-white/70 leading-relaxed font-medium mb-4">
                        {s.description}
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-2">
                        {s.points.map((p) => (
                          <li key={p} className="flex items-center gap-2 text-xs text-white/65 font-medium">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: LIME }}
                            />
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

          {/* Hint de scroll */}
          <p className="text-white/35 text-xs text-center mt-6 font-medium tracking-widest uppercase transition-opacity duration-300"
            style={{ opacity: currentIndex < solutions.length - 1 ? 1 : 0 }}>
            Desliza para ver más
          </p>
        </div>
      </div>
    </div>
  )
}
