import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Footer } from "@/components/Footer"
import { SolucionesScroll } from "./SolucionesScroll"



export default function SolucionesPage() {
  return (
    <div className="min-h-screen bg-surqo-bg">

      {/* ── HERO ── */}
      <section className="relative h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#1a3318" }}>
        <div className="absolute inset-0 z-0" style={{ backgroundColor: "#1a3318" }}>
          <Image
            src="/tractor.jpg"
            alt="Tractor agrícola"
            fill
            priority
            quality={90}
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARCAAIABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAeEAABBAMBAQAAAAAAAAAAAAABAAIDBBESITH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmtjlsxPnx3HXX0oW2htCiRygEgAn/9k="
            className="object-cover object-center transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Texto — mismo layout que hero de inicio */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 max-w-4xl">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#86E66A" }}>
            Soluciones
          </p>
          <h1
            className="font-black tracking-tight text-white leading-none mb-5"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
          >
            Todo lo que necesita<br />
            <span style={{ color: "#86E66A" }}>tu finca</span>
          </h1>
          <p className="text-white/75 font-medium max-w-xl leading-relaxed"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}>
            Cuatro módulos integrados que cubren el ciclo completo: sensores en campo, análisis con IA, alertas automáticas y visualización.
          </p>
        </div>
      </section>


      {/* ── SOLUTIONS (scroll sticky) ── */}
      <SolucionesScroll />


      {/* ── CTA ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#1a3318" }}>
        {/* Imagen aérea de cultivos */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: "#1a3318" }}>
          <Image
            src="/glavo-aerial-view-2830059.webp"
            alt="Vista aérea de cultivo de maíz"
            fill
            priority
            quality={85}
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARCAAIABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUH/8QAHhAAAgIDAQEBAAAAAAAAAAAAAQIDBBEhMUFR/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJtjWI6ZweFt4sKLMiRlDdGWFgHAA5z/AFF7mIW+lNLfaMHXqXqQO/uaKKAP/9k="
            className="object-cover object-center transition-opacity duration-500"
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
