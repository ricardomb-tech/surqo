import React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { AuthProvider } from "@/components/AuthProvider"
import { NavBar } from "@/components/NavBar"
import { Zap } from "lucide-react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "Surqo — Inteligencia Agroclimática",
  description: "Plataforma IoT + IA para el campo colombiano.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} dark`} suppressHydrationWarning>
      <body className="bg-surqo-bg text-surqo-text antialiased font-sans transition-colors duration-500 selection:bg-surqo-green/30">
        <AuthProvider>
          <NavBar />
          <main className="relative z-10">{children}</main>
          <footer className="border-t border-black/5 dark:border-white/5 py-12 mt-20">
            <div className="max-w-6xl mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-surqo-green" />
                <span className="text-xl font-black tracking-tighter text-gradient">SURQO</span>
              </div>
              <p className="text-surqo-text-muted text-sm font-medium">
                © 2026 Surqo · Inteligencia Agroclimática · Córdoba, Colombia
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
