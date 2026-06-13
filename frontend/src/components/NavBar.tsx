"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  Zap, LayoutDashboard, Activity, Bell,
  FlaskConical, Sprout, Menu, X, LogOut, ChevronDown,
} from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/Primitives"
import { cn } from "@/lib/utils"

const APP_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sensors",   label: "Sensores",   icon: Activity },
  { href: "/alerts",    label: "Alertas",    icon: Bell },
  { href: "/analyze",   label: "Análisis IA", icon: FlaskConical },
  { href: "/farms",     label: "Fincas",     icon: Sprout },
]

const PUBLIC_PATHS = ["/", "/login", "/register", "/precios", "/privacidad", "/terminos"]

const PUBLIC_NAV_LINKS = [
  { href: "/precios", label: "Precios" },
]

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isPublicPage = PUBLIC_PATHS.includes(pathname)
  const showAppNav = user && !isPublicPage

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-surqo-bg/90 backdrop-blur-xl shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
          <Zap className="w-5 h-5 text-surqo-green" />
          <span className="text-lg font-black tracking-tighter text-gradient">SURQO</span>
        </Link>

        {/* Public nav links */}
        {isPublicPage && !user && (
          <div className="hidden md:flex items-center gap-1">
            {PUBLIC_NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  pathname === href
                    ? "bg-green-50 text-surqo-green border border-green-200"
                    : "text-surqo-text-secondary hover:text-surqo-text hover:bg-slate-100"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* App nav — solo cuando hay sesión y no es página pública */}
        {showAppNav && (
          <div className="hidden md:flex items-center gap-1">
            {APP_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  pathname.startsWith(href)
                    ? "bg-green-50 text-surqo-green border border-green-200"
                    : "text-surqo-text-secondary hover:text-surqo-text hover:bg-slate-100"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-20 h-8 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-surqo-text-secondary hover:text-surqo-text hover:bg-slate-100 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-xs font-black text-surqo-green">
                  {user.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="hidden sm:block max-w-[120px] truncate text-xs font-medium text-surqo-text">
                  {user.email}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", userMenuOpen && "rotate-180")} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 z-50 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-lg">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-surqo-text truncate">{user.email}</p>
                      <p className="text-xs text-surqo-text-muted mt-0.5">Plataforma Surqo</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleSignOut() }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-surqo-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>
          )}

          {/* Mobile toggle — solo en app */}
          {showAppNav && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-surqo-text-secondary hover:bg-slate-100 transition-all"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {showAppNav && menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
          {APP_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                pathname.startsWith(href)
                  ? "bg-green-50 text-surqo-green"
                  : "text-surqo-text-secondary hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
