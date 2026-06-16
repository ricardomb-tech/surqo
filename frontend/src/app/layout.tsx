import React from "react"
import type { Metadata } from "next"
import { Inter, Outfit, Archivo } from "next/font/google"
import { AuthProvider } from "@/components/AuthProvider"
import { NavBar } from "@/components/NavBar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", weight: ["400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: "Surqo — Inteligencia Agroclimática",
  description: "Plataforma IoT + IA para el campo colombiano.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} ${archivo.variable}`} suppressHydrationWarning>
      <body className="bg-surqo-bg text-surqo-text antialiased font-sans transition-colors duration-500 selection:bg-surqo-green/30">
        <AuthProvider>
          <NavBar />
          <main className="relative z-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
