import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Footer } from "@/components/Footer"
import { SolucionesScroll } from "./SolucionesScroll"



export default function SolucionesPage() {
  return (
    <div className="min-h-screen bg-surqo-bg">

      {/* ── HERO ── */}
      <section className="relative h-screen flex items-end overflow-hidden" style={{ backgroundColor: "#1a3318" }}>
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
      <section className="relative h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#1a3318" }}>
        {/* Imagen aérea de cultivos */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/glavo-aerial-view-2830059.jpg"
            alt="Vista aérea de cultivo de maíz"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Blob blanco central */}
        <div
          className="relative z-10 w-[88vw] sm:w-auto sm:max-w-lg mx-auto text-center px-8 sm:px-16 py-14 sm:py-20"
          style={{
            background: "white",
            borderRadius: "62% 38% 55% 45% / 52% 48% 52% 48%",
            boxShadow: "0 20px 80px rgba(0,0,0,0.22)",
          }}
        >
          <h2 className="font-black leading-tight mb-4"
            style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", color: "#1a3318" }}>
            ¿Listo para conectar<br />tu finca?
          </h2>
          <p className="font-semibold mb-8 leading-relaxed" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", color: "#4a7c2f" }}>
            Crea tu cuenta gratis y empieza a<br />monitorear tu cultivo en minutos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 font-black px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)", border: "2px solid #3a6b1a", color: "#3a6b1a" }}
          >
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
