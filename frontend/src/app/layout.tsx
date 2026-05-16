import React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { Button } from "@/components/ui/Primitives"
import { Menu, Zap } from "lucide-react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "Surqo — Inteligencia Agroclimática",
  description: "Plataforma Pro Max de análisis IoT y clima para el campo colombiano.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} dark`} suppressHydrationWarning>
      <body className="bg-surqo-bg text-surqo-text antialiased font-sans transition-colors duration-500 selection:bg-surqo-green/30">
        {/* Main Navigation */}
        <header className="sticky top-0 z-[100] w-full px-4 pt-4 pointer-events-none">
          <nav className="max-w-6xl mx-auto glass rounded-2xl border border-black/5 dark:border-white/10 backdrop-blur-3xl bg-surqo-bg/40 pointer-events-auto shadow-glow-sm">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <a href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-green-gradient flex items-center justify-center shadow-glow-md group-hover:rotate-12 transition-all duration-500">
                  <Zap className="w-6 h-6 text-white fill-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tighter text-gradient">SURQO</span>
                  <span className="text-[10px] font-bold text-surqo-text-muted tracking-widest uppercase">Insight Field</span>
                </div>
              </a>

              <div className="hidden lg:flex items-center gap-2">
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/analyze", label: "Análisis IA" },
                  { href: "/sensors", label: "Hardware" },
                  { href: "/alerts", label: "Protocolos" },
                ].map((link) => (
                  <Button key={link.href} variant="ghost" size="sm" asChild>
                    <a href={link.href} className="relative group">
                      {link.label}
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-surqo-green group-hover:w-full transition-all duration-300" />
                    </a>
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10 mx-1 hidden sm:block" />
                <Button variant="primary" size="sm" className="hidden sm:flex gap-2">
                  <span className="live-dot w-2 h-2" />
                  LIVE DATA
                </Button>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </nav>
        </header>

        <main className="relative z-10">{children}</main>

        <footer className="border-t border-black/5 dark:border-white/5 py-12 mt-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-surqo-green" />
              <span className="text-xl font-black tracking-tighter text-gradient">SURQO</span>
            </div>
            <p className="text-surqo-text-muted text-sm font-medium">
              © 2024 Surqo Insight Field · Inteligencia Agroclimática · Córdoba, Colombia
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
