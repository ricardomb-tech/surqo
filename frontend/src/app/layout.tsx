import React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { AuthProvider } from "@/components/AuthProvider"
import { NavBar } from "@/components/NavBar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "Surqo — Inteligencia Agroclimática",
  description: "Plataforma IoT + IA para el campo colombiano.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="bg-surqo-bg text-surqo-text antialiased font-sans transition-colors duration-500 selection:bg-surqo-green/30">
        <AuthProvider>
          <NavBar />
          <main className="relative z-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
