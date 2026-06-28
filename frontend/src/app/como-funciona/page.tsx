import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Terminal, ChevronDown, Cpu, Wifi, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { Footer } from "@/components/Footer"
import { PasosScroll } from "./PasosScroll"


export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-surqo-bg">

      {/* ── HERO ── */}
      <section className="relative h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#1a3318" }}>
        <div className="absolute inset-0 z-0" style={{ backgroundColor: "#1a3318" }}>
          <Image
            src="/hero-bg3.webp"
            alt="Campo de trigo al atardecer"
            fill
            priority
            quality={90}
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARCAAIABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQQG/8QAHhAAAgICAwEBAAAAAAAAAAAAAQIDBAAREiFB/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVj9SxsGlJFOSCOM43MvJxz7D9dFa0Stw7RcRSQIFmkUqm4jLEDB+igCig//9k="
            className="object-cover object-center transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Texto — mismo layout que hero de inicio */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 max-w-4xl">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#86E66A" }}>
            Cómo funciona
          </p>
          <h1
            className="font-black text-white leading-none tracking-tight mb-5"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
          >
            Del sensor al análisis<br />
            <span style={{ color: "#86E66A" }}>en 5 pasos</span>
          </h1>
          <p
            className="text-white/75 font-medium max-w-xl leading-relaxed"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
          >
            Un flujo completo desde el hardware en campo hasta la recomendación agronómica en tu pantalla.
          </p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <Link
            href="#pasos"
            className="flex items-center justify-center w-14 h-14 rounded-full transition-transform hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)",
              border: "1px solid rgba(255,255,255,0.50)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.70)",
            }}
          >
            <ChevronDown className="w-6 h-6 text-white" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ── 5 PASOS — sticky scroll ── */}
      <div id="pasos">
        <PasosScroll />
      </div>

      {/* ── HARDWARE ── */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Hardware</p>
            <h2 className="text-4xl font-black tracking-tighter mb-4">Hardware listo para usar</h2>
            <p className="text-surqo-text-secondary font-medium max-w-lg mx-auto leading-relaxed">
              Surqo proporciona un <span className="font-black text-surqo-text">hardware especializado de bajo costo</span> diseñado para funcionar desde el primer día. Cubre todo el ciclo — desde la recolección de datos en campo hasta la transmisión segura al servidor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Cpu,           title: "Nodo de sensores",       desc: "Dispositivo compacto con sensores de temperatura, humedad del aire y del suelo. Diseñado para operar semanas con una sola carga." },
              { icon: Wifi,          title: "Conectividad garantizada", desc: "Transmisión cifrada vía MQTT TLS. Compatible con WiFi o redes 4G según las condiciones de tu finca." },
              { icon: LayoutDashboard, title: "Integración total",     desc: "El hardware se sincroniza automáticamente con la plataforma. Sin configuraciones complejas ni cables adicionales." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-2xl border border-white/[0.07] p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-surqo-green" />
                </div>
                <p className="font-black text-surqo-text text-sm">{title}</p>
                <p className="text-xs text-surqo-text-secondary font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 glass rounded-2xl border border-surqo-sky/20 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-surqo-sky/10 border border-surqo-sky/20 flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-surqo-sky" />
            </div>
            <div>
              <p className="text-sm font-bold text-surqo-text mb-1">¿Quieres probar antes?</p>
              <p className="text-xs text-surqo-text-secondary font-medium leading-relaxed">
                Usa el simulador integrado para generar lecturas realistas y explorar toda la plataforma sin necesidad de hardware físico. Lo encuentras en la sección <strong className="text-surqo-text">Sensores</strong> del dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="glass rounded-3xl border border-surqo-green/20 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-15 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tighter mb-3">Empieza hoy, gratis</h2>
            <p className="text-surqo-text-secondary font-medium mb-8 max-w-md mx-auto">
              Crea tu cuenta, registra tu finca y conecta el sensor. O prueba con el simulador sin comprar nada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/register">
                  Crear cuenta gratis <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/preguntas">Preguntas frecuentes</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
