"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { Footer } from "@/components/Footer"

const CATEGORIES = [
  {
    label: "General",
    faqs: [
      {
        q: "¿Qué es Surqo?",
        a: "Surqo es una plataforma de inteligencia agroclimática para el campo colombiano. Combina sensores IoT (ESP32) con análisis de IA para darte recomendaciones agronómicas precisas: cuándo regar, cuánto fertilizar, qué riesgos hay esta semana.",
      },
      {
        q: "¿Cuánto cuesta Surqo?",
        a: "Surqo es completamente gratuito. No hay planes de pago, no hay tarjeta de crédito, no hay letra pequeña. Es una solución abierta para el agricultor colombiano.",
      },
      {
        q: "¿En qué regiones de Colombia funciona?",
        a: "En cualquier lugar con acceso a internet. El pronóstico climático viene de Open-Meteo y cubre todo el territorio nacional. El piloto activo está en Córdoba, pero cualquier productor colombiano puede registrarse.",
      },
    ],
  },
  {
    label: "Hardware",
    faqs: [
      {
        q: "¿Qué hardware necesito?",
        a: "Un ESP32 (~$8 USD), sensor DHT22 (~$4 USD), sensor capacitivo de suelo (~$3 USD) y una batería LiPo (~$6 USD). Todo cuesta menos de $22 USD y está disponible en MercadoLibre Colombia.",
      },
      {
        q: "¿Funciona sin internet en la finca?",
        a: "El nodo ESP32 necesita WiFi o un router 4G/LTE para enviar datos. El consumo de datos es mínimo (menos de 5 MB/mes). Puedes usar un teléfono como punto de acceso si no tienes WiFi.",
      },
      {
        q: "¿Cuánto dura la batería del sensor?",
        a: "El nodo entra en deep sleep entre lecturas (cada 15 minutos). Con una batería LiPo de 3000 mAh puede durar entre 2 y 6 semanas dependiendo de la señal WiFi y la temperatura ambiente.",
      },
      {
        q: "¿El DHT11 funciona o necesito DHT22?",
        a: "El firmware soporta ambos. El DHT11 es más económico pero menos preciso (±2°C, ±5% HR). El DHT22 da ±0.5°C y ±2-5% HR, ideal para decisiones agronómicas. Recomendamos DHT22.",
      },
    ],
  },
  {
    label: "Plataforma",
    faqs: [
      {
        q: "¿Puedo probar Surqo sin tener hardware?",
        a: "Sí. Tenemos un simulador Python que genera lecturas realistas vía MQTT. Puedes crear una cuenta, registrar tu finca y simular datos en minutos sin comprar ningún componente. Lo encuentras en la sección Sensores del dashboard.",
      },
      {
        q: "¿Cómo funciona el análisis con IA?",
        a: "Combinamos tus datos del sensor (temperatura, humedad de suelo, VPD) con el pronóstico climático de 7 días de Open-Meteo para tu ubicación GPS exacta. El modelo Llama 3.3 70B genera recomendaciones en español claro, específicas para tu cultivo.",
      },
      {
        q: "¿Cuántas fincas puedo registrar?",
        a: "Una finca por cuenta. Es suficiente para monitorear tu cultivo completo con múltiples lecturas del mismo nodo.",
      },
      {
        q: "¿Cada cuánto puedo hacer análisis de IA?",
        a: "Los análisis con IA son ilimitados. Puedes hacer uno cuando quieras desde la sección Análisis del dashboard.",
      },
    ],
  },
  {
    label: "Seguridad",
    faqs: [
      {
        q: "¿Mis datos son privados y seguros?",
        a: "Sí. Toda la comunicación usa HTTPS/TLS. La conexión MQTT usa TLS en el puerto 8883. Las contraseñas nunca se almacenan en texto plano (bcrypt vía Supabase). Cada usuario solo puede ver sus propios datos (Row Level Security).",
      },
      {
        q: "¿Necesito conocimientos técnicos para instalarlo?",
        a: "El proceso está diseñado para ser simple: editas config.h con tu WiFi y Farm ID, flasheas el firmware con PlatformIO (un clic) y conectas el sensor. La guía paso a paso está en el dashboard en la sección Sensores.",
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`glass rounded-2xl border transition-all duration-200 overflow-hidden ${open ? "border-surqo-green/20" : "border-white/[0.07]"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className={`font-bold text-sm transition-colors duration-200 ${open ? "text-surqo-green" : "text-surqo-text group-hover:text-surqo-green"}`}>
          {q}
        </span>
        <ChevronDown className={`w-4 h-4 text-surqo-text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-surqo-green" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-surqo-green/10">
          <p className="text-sm text-surqo-text-secondary font-medium leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function PreguntasPage() {
  const [activeCategory, setActiveCategory] = useState("General")

  const current = CATEGORIES.find((c) => c.label === activeCategory)!

  return (
    <div className="min-h-screen bg-surqo-bg">

      {/* ── HEADER ── */}
      <section className="pt-28 pb-16 text-center max-w-3xl mx-auto px-4">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Preguntas frecuentes</p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-5">
          Todo lo que necesitas<br />
          <span className="text-gradient">saber</span>
        </h1>
        <p className="text-lg text-surqo-text-secondary font-medium max-w-md mx-auto">
          Resolvemos las dudas más comunes antes de que empieces.
        </p>
      </section>

      {/* ── BODY ── */}
      <section className="max-w-3xl mx-auto px-4 pb-20">

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setActiveCategory(c.label)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeCategory === c.label
                  ? "bg-surqo-green text-white"
                  : "glass border border-white/[0.08] text-surqo-text-secondary hover:text-surqo-text"
              }`}
            >
              {c.label}
              <span className={`ml-2 text-xs ${activeCategory === c.label ? "opacity-70" : "opacity-50"}`}>
                {c.faqs.length}
              </span>
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="space-y-3">
          {current.faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 glass rounded-2xl border border-white/[0.07] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-surqo-green" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-surqo-text text-sm">¿No encontraste tu respuesta?</p>
            <p className="text-xs text-surqo-text-muted font-medium mt-0.5">
              Escríbenos y te respondemos en menos de 24 horas.
            </p>
          </div>
          <a
            href="mailto:hola@surqo.co"
            className="text-sm font-bold text-surqo-green-bright hover:underline shrink-0"
          >
            hola@surqo.co →
          </a>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-black tracking-tighter mb-3">¿Todo claro?</h2>
          <p className="text-surqo-text-secondary font-medium mb-8">
            Crea tu cuenta gratis y empieza hoy.
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
      </section>

      <Footer />
    </div>
  )
}
