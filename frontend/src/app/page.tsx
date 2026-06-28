import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronDown, Play, ShieldCheck, FlaskConical, Zap, Leaf, Cpu, Brain, BarChart3 } from "lucide-react"
import { Footer } from "@/components/Footer"
import { SurqoIcon } from "@/components/SurqoIcon"

// ── PHOTOS (Unsplash) ─────────────────────────────────────────────────────────
const PHOTO_HERO    = "/hero-bg.jpg" // reemplaza con tu imagen en frontend/public/hero-bg.jpg
const PHOTO_FARMER  = "https://images.unsplash.com/photo-1595872729893-6af3e84f3f69?w=900&q=80"
const PHOTO_FIELD   = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80"
const PHOTO_TRACTOR = "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80"

// ── GLASS CARD ───────────────────────────────────────────────────────────────

// Colores del diseño Claude Design
const GLASS_BG = "rgba(26, 51, 24, 0.55)"       // #1a3318 · 55%
const GLASS_BORDER = "rgba(255, 255, 255, 0.25)" // borde blanco sutil
const LIME = "#86E66A"                            // color "Insight." del diseño

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-[28px] px-7 py-5 text-white"
      style={{
        background: GLASS_BG,
        border: `1px solid ${GLASS_BORDER}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── PAGE ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#1a3318" }}>
        {/* Background photo — color fallback mientras carga */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: "#1a3318" }}>
          <Image
            src={PHOTO_HERO}
            alt="Campo colombiano visto desde el aire"
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARCAAIABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAeEAABBAMBAQAAAAAAAAAAAAABAAIDERIhMUFR/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKlhL1H1DjRIpKISmNz0tzSWAA75wMfVFFAH/9k="
            className="object-cover object-center transition-opacity duration-500"
          />
          {/* subtle gradient only on left so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col flex-1 pt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex-1 flex items-center w-full">
            <div className="flex w-full items-center">

              {/* ── LEFT: title + CTAs ── */}
              <div className="w-full lg:w-[420px] shrink-0 lg:mr-auto">
                {/* Glass card behind title */}
                <div className="w-fit rounded-[28px] sm:rounded-[36px] px-6 sm:px-10 py-6 sm:py-8 mb-6 sm:mb-8"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 100%)",
                    border: "1px solid rgba(255,255,255,0.50)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.10), inset 0 2px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(0,0,0,0.06)",
                    backdropFilter: "blur(16px) saturate(160%)",
                    WebkitBackdropFilter: "blur(16px) saturate(160%)",
                  }}>
                  <h1 className="font-archivo font-black leading-none tracking-tight text-white"
                    style={{ fontSize: "clamp(2.4rem, 8vw, 5.5rem)" }}>
                    Del surco al
                    <br />
                    <span style={{ color: LIME }}>Insight.</span>
                  </h1>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 sm:ml-28">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 font-black px-6 sm:px-8 py-2.5 rounded-full text-sm tracking-widest uppercase transition-all hover:scale-105"
                    style={{ border: `2px solid ${LIME}`, color: LIME }}
                  >
                    EMPEZAR GRATIS <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/soluciones"
                    className="inline-flex items-center gap-2 border-2 border-white/50 text-white font-black px-6 sm:px-8 py-2.5 rounded-full text-sm tracking-widest uppercase hover:border-white transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" /> VER
                  </Link>
                </div>
              </div>

              {/* ── RIGHT: floating glass cards ── */}
              <div className="hidden lg:block relative h-[460px]" style={{ width: "520px", marginRight: "-60px" }}>

                {/* Card: IA Agronómica — top center */}
                <GlassCard style={{ top: "5%", right: "18%", transform: "none" }}>
                  <Brain className="w-8 h-8 mx-auto mb-3" style={{ color: LIME }} />
                  <p className="text-base font-black text-center">IA Agronómica</p>
                  <p className="text-sm text-white/70 text-center">Llama 3.3 70B</p>
                </GlassCard>

                {/* Card: Sensores IoT — left middle */}
                <GlassCard style={{ top: "28%", left: "2%" }}>
                  <Cpu className="w-8 h-8 mb-3" style={{ color: LIME }} />
                  <p className="text-base font-black">Sensores IoT</p>
                  <p className="text-sm text-white/70">ESP32 + DHT22 en campo real</p>
                </GlassCard>

                {/* Card: Alertas — right middle */}
                <GlassCard style={{ top: "36%", right: "2%" }}>
                  <svg className="w-8 h-8 mb-3" style={{ color: LIME }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-base font-black">Alertas automáticas</p>
                  <p className="text-sm text-white/70">Estrés hídrico, plagas, temp.</p>
                </GlassCard>

                {/* Card: Dashboard — bottom center */}
                <GlassCard style={{ bottom: "5%", right: "18%", transform: "none" }}>
                  <BarChart3 className="w-8 h-8 mx-auto mb-3" style={{ color: LIME }} />
                  <p className="text-base font-black text-center">Dashboard 24/7</p>
                  <p className="text-sm text-white/70 text-center">VPD, ETc, humedad, historial</p>
                </GlassCard>

                {/* Chat bubble — texto descripción */}
                <div className="absolute max-w-[300px]" style={{ bottom: "-8%", left: "-35%" }}>
                  <div className="relative rounded-2xl rounded-bl-sm px-6 py-5 text-white"
                    style={{
                      backdropFilter: "blur(32px) saturate(150%) brightness(1.05)",
                      WebkitBackdropFilter: "blur(32px) saturate(150%) brightness(1.05)",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.00) 60%, rgba(255,255,255,0.02) 100%)",
                      boxShadow: "0 20px 56px rgba(0,0,0,0.28), inset 0 1px 1px rgba(255,255,255,0.75)",
                    }}>
                    <p className="text-[14px] text-white/90 leading-relaxed">
                      Inteligencia agroclimática para el campo colombiano.{" "}
                      <span style={{ color: LIME }}>IoT + IA</span> que convierte datos del suelo{" "}
                      en <span style={{ color: LIME }}>decisiones concretas</span>.
                    </p>
                    <div className="absolute -bottom-2 left-5 w-4 h-4 overflow-hidden">
                      <div className="w-4 h-4 rotate-45 origin-top-right"
                        style={{
                          backdropFilter: "blur(32px)",
                          WebkitBackdropFilter: "blur(32px)",
                          background: "rgba(255,255,255,0.04)",
                        }} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Mini feature pills — visible solo en móvil */}
          <div className="lg:hidden flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
            {[
              { icon: Brain, label: "IA Agronómica" },
              { icon: Cpu, label: "Sensores IoT" },
              { icon: BarChart3, label: "Dashboard 24/7" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white text-xs font-bold"
                style={{
                  background: "rgba(26,51,24,0.65)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  backdropFilter: "blur(12px)",
                }}>
                <Icon className="w-3.5 h-3.5" style={{ color: LIME }} />
                {label}
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div className="flex justify-center pb-6 relative z-10">
            <ChevronDown className="w-7 h-7 text-white/50 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── EL PROBLEMA ──────────────────────────────────────────────────── */}
      <section className="mx-3 sm:mx-4 lg:mx-8 mt-4 rounded-3xl overflow-hidden" style={{ backgroundColor: "#E8EBE4" }}>
        <div className="grid lg:grid-cols-2">

          {/* Left – text, vertically centered */}
          <div className="flex flex-col justify-center px-7 sm:px-12 py-12 lg:py-44">
            <h2 className="font-archivo font-black leading-tight tracking-tight mb-6"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 3.2rem)", color: "#3a6b1a" }}>
              El agricultor colombiano decide a ciegas.
            </h2>
            <p className="text-slate-600 font-medium text-base lg:text-lg leading-relaxed max-w-sm">
              Sin datos locales de suelo y clima, cada decisión de riego,
              fertilización o fumigación es una apuesta. Surqo cierra esa brecha
              con tecnología accesible e inteligencia artificial.
            </p>
          </div>

          {/* Right – farmer + floating questions */}
          <div className="relative overflow-hidden min-h-[340px] lg:min-h-0">
            {/* Farmer image */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 lg:left-[100px] lg:translate-x-0 w-[280px] sm:w-[360px] lg:w-[480px] h-[110%]">
              <Image
                src="/farmer.png"
                alt="Agricultor colombiano"
                fill
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 480px"
                className="object-contain object-bottom"
              />
            </div>

            {/* Floating question bubbles — hidden on small mobile, visible from sm */}
            <div className="hidden sm:block absolute top-[12%] left-[22%] max-w-[170px] text-center">
              <p className="text-sm lg:text-base text-slate-700 font-semibold leading-snug">¿Cuánta agua estoy desperdiciando sin saberlo?</p>
            </div>

            <div className="hidden sm:block absolute top-[38%] left-[4%] max-w-[155px]">
              <p className="text-sm lg:text-base text-slate-700 font-semibold leading-snug">¿Cuándo exactamente debo regar?</p>
            </div>

            <div className="hidden sm:block absolute top-[22%] right-[8%] lg:right-[20%] max-w-[160px] lg:max-w-[175px] text-right">
              <p className="text-sm lg:text-base text-slate-700 font-semibold leading-snug">¿El clima favorece hongos o plagas esta semana?</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3 PASOS ──────────────────────────────────────────────────────── */}
      {/* ── 3 PASOS ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">

          {/* Title */}
          <h2 className="font-archivo font-black text-center mb-10 tracking-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#4a6b0a" }}>
            De 0 a datos reales en 3 pasos
          </h2>

          {/* 3 cards — horizontal en desktop, vertical en móvil */}
          <div className="flex flex-col lg:flex-row items-stretch gap-0 rounded-3xl overflow-hidden" style={{ minHeight: "320px" }}>

            {/* Step 1 — dark olive */}
            <div className="flex-1 flex flex-col justify-end p-7 lg:p-8" style={{ backgroundColor: "#5a7a0a" }}>
              <h3 className="text-xl lg:text-2xl font-black text-white leading-tight mb-3">
                Conecta el<br />sensor
              </h3>
              <p className="text-sm text-white/75 leading-relaxed">
                ESP32 + DHT22 + sensor de suelo.<br />Instalación fácil. Datos cada 15 min.
              </p>
            </div>

            {/* Arrow 1 */}
            <div className="flex items-center justify-center relative z-10 lg:-mx-6 -my-5 lg:my-0">
              <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-white shadow-lg flex items-center justify-center rotate-90 lg:rotate-0">
                <ArrowRight className="w-7 h-7 lg:w-10 lg:h-10" style={{ color: "#5a7a0a" }} />
              </div>
            </div>

            {/* Step 2 — light gray */}
            <div className="flex-1 flex flex-col justify-center p-7 lg:p-8 text-center" style={{ backgroundColor: "#E8EBE4" }}>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">
                Combinamos tus datos con el pronóstico de 7 días para generar recomendaciones precisas.
              </p>
              <h3 className="text-xl lg:text-2xl font-black" style={{ color: "#2D2D2D" }}>
                La IA analiza
              </h3>
            </div>

            {/* Arrow 2 */}
            <div className="flex items-center justify-center relative z-10 lg:-mx-6 -my-5 lg:my-0">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white shadow-lg flex items-center justify-center rotate-90 lg:rotate-0">
                <ArrowRight className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: "#a07800" }} />
              </div>
            </div>

            {/* Step 3 — gold/mustard */}
            <div className="flex-1 flex flex-col justify-between p-7 lg:p-8" style={{ backgroundColor: "#a07800" }}>
              <h3 className="text-xl lg:text-2xl font-black text-white lg:text-right leading-tight">
                Tú decides
              </h3>
              <p className="text-sm text-white/75 leading-relaxed lg:text-right mt-4">
                Dashboard en tiempo real con KPIs, alertas e historial desde cualquier dispositivo.
              </p>
            </div>

          </div>

          {/* See Process link */}
          <div className="text-center mt-8">
            <Link
              href="/como-funciona"
              className="inline-flex items-center gap-2 font-black text-base hover:underline"
              style={{ color: "#5a7a0a" }}
            >
              Ver proceso <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONSTRUIDO PARA COLOMBIA ──────────────────────────────────────── */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/campo-surqo.jpg"
            alt="Campesino fumigando en campo colombiano"
            fill
            className="object-cover object-center"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-black tracking-[0.2em] uppercase mb-4" style={{ color: LIME }}>Por qué Surqo</p>
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight mb-6">
                Construido para<br />
                <span style={{ color: LIME }}>el campo colombiano</span>
              </h2>
              <p className="text-white/65 text-sm leading-relaxed max-w-md">
                No para laboratorios. Diseñado para condiciones reales: clima tropical,
                conectividad limitada y decisiones que no pueden esperar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: ShieldCheck, title: "Tus datos son tuyos", desc: "TLS en todas las conexiones y Row Level Security. Nadie más accede a tu información." },
                { icon: FlaskConical, title: "Ciencia en cada consejo", desc: "VPD, evapotranspiración (ETc) e índice de estrés hídrico calculados con tus datos reales." },
                { icon: Zap, title: "100% gratuito, siempre", desc: "Sin planes, sin tarjeta, sin letra pequeña. Tecnología agrícola para todos." },
                { icon: Leaf, title: "Para el agricultor real", desc: "Interfaz en español, recomendaciones contextuales para el trópico colombiano." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5">
                  <Icon className="w-6 h-6 mb-3" style={{ color: LIME }} />
                  <h3 className="text-sm font-black text-white mb-2">{title}</h3>
                  <p className="text-xs text-white/55 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SENSORES REALES ──────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Photo */}
            <div className="relative h-80 lg:h-[460px] rounded-2xl overflow-hidden">
              <Image
                src={PHOTO_TRACTOR}
                alt="Agricultura de precisión con tecnología"
                fill
                className="object-cover object-center"
                unoptimized
              />
            </div>

            {/* Text */}
            <div>
              <p className="text-xs font-black tracking-[0.2em] uppercase mb-3" style={{ color: "#4a7c2f" }}>Hardware</p>
              <h2 className="text-4xl font-black tracking-tighter mb-4" style={{ color: "#2D4A1E" }}>
                Sensores de campo real
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Nodos ESP32 con sensores DHT22 (temperatura y humedad del aire)
                y sensor capacitivo de suelo. Lecturas enviadas cada 15 minutos
                vía MQTT TLS directamente desde tu finca.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "Temperatura y humedad del aire",
                  "Temperatura y humedad del suelo",
                  "Humedad relativa ambiente",
                  "Deep sleep — dura semanas con batería",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#8BBE44" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/soluciones"
                className="inline-flex items-center gap-2 font-black text-sm"
                style={{ color: "#4a7c2f" }}
              >
                Ver todas las soluciones <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">

          {/* Título con imagen recortada en el texto */}
          <h2 className="font-archivo font-black leading-tight tracking-tight mb-6"
            style={{ fontSize: "clamp(2rem, 5vw, 5rem)" }}>
            <span style={{
              backgroundImage: "url('/cta-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              display: "block",
              whiteSpace: "nowrap",
            }}>
              Tu campo inteligente
            </span>
            <span style={{
              backgroundImage: "url('/cta-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center 60%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              display: "block",
              whiteSpace: "nowrap",
            }}>
              te está esperando
            </span>
          </h2>

          <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            Crea tu cuenta, registra tu finca y empieza a recibir análisis
            agronómicos con IA en menos de 5 minutos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-black px-8 py-4 rounded-full text-white text-base transition-all hover:scale-105"
              style={{ backgroundColor: "#3a6b1a" }}
            >
              Crear cuenta gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-base text-slate-500 hover:text-slate-800 transition-colors"
            >
              Ya tengo una cuenta ↘
            </Link>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
