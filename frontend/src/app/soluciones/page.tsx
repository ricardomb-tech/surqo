import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Footer } from "@/components/Footer"
import { SolucionesScroll } from "./SolucionesScroll"



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


      {/* ── SOLUTIONS (scroll sticky) ── */}
      <SolucionesScroll />


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
