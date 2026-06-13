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

// ── App nav (autenticado) ────────────────────────────────────────────────────

const APP_LINKS = [
  { href: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
  { href: "/sensors",   label: "Sensores",    icon: Activity },
  { href: "/alerts",    label: "Alertas",     icon: Bell },
  { href: "/analyze",   label: "Análisis IA", icon: FlaskConical },
  { href: "/farms",     label: "Fincas",      icon: Sprout },
]

// ── Public nav (sin sesión) ──────────────────────────────────────────────────

const PUBLIC_LINKS = [
  { href: "/",              label: "Inicio" },
  { href: "/soluciones",    label: "Soluciones" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/preguntas",     label: "Preguntas" },
]

const PUBLIC_PATHS = [
  "/", "/login", "/register",
  "/soluciones", "/como-funciona", "/preguntas",
  "/privacidad", "/terminos",
]

// ── Component ────────────────────────────────────────────────────────────────

export function NavBar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, loading, signOut } = useAuth()

  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isPublicPage = PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  )
  const showAppNav    = !!user && !isPublicPage
  const showPublicNav = !user && isPublicPage

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-surqo-bg/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 shrink-0 group"
          >
            <Zap className="w-5 h-5 text-surqo-green group-hover:scale-110 transition-transform" />
            <span className="text-lg font-black tracking-tighter text-gradient">SURQO</span>
          </Link>

          {/* ── PUBLIC center nav ── */}
          {showPublicNav && (
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {PUBLIC_LINKS.map(({ href, label }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-3 py-2 text-sm font-semibold transition-colors duration-200",
                      active
                        ? "text-surqo-text"
                        : "text-surqo-text-secondary hover:text-surqo-text"
                    )}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-surqo-green" />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* ── APP center nav ── */}
          {showAppNav && (
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {APP_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    pathname.startsWith(href)
                      ? "bg-surqo-green/10 text-surqo-green border border-surqo-green/20"
                      : "text-surqo-text-secondary hover:text-surqo-text hover:bg-white/[0.05]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* ── Right side ── */}
          <div className="flex items-center gap-2 shrink-0">
            {loading ? (
              <div className="w-20 h-8 rounded-xl bg-white/[0.06] animate-pulse" />
            ) : user ? (
              /* User menu */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-surqo-text-secondary hover:text-surqo-text hover:bg-white/[0.06] transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-xs font-black text-surqo-green">
                    {user.email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate text-xs font-medium text-surqo-text">
                    {user.email}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 z-50 glass rounded-2xl border border-white/[0.10] p-1.5 shadow-2xl">
                      <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                        <p className="text-xs font-bold text-surqo-text truncate">{user.email}</p>
                        <p className="text-xs text-surqo-text-muted mt-0.5 font-medium">Plataforma Surqo</p>
                      </div>
                      <button
                        onClick={() => { setUserMenuOpen(false); handleSignOut() }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-surqo-text-secondary hover:text-surqo-danger hover:bg-surqo-danger/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Public auth buttons */
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Registrarse</Link>
                </Button>
              </div>
            )}

            {/* Mobile hamburger */}
            {(showPublicNav || showAppNav) && (
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden p-2 rounded-xl text-surqo-text-secondary hover:bg-white/[0.06] transition-all"
                aria-label="Menú"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-16 inset-x-0 z-50 md:hidden glass border-b border-white/[0.08] px-4 py-4 flex flex-col gap-1">

            {showPublicNav && (
              <>
                {PUBLIC_LINKS.map(({ href, label }) => {
                  const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                        active
                          ? "bg-surqo-green/10 text-surqo-green border border-surqo-green/20"
                          : "text-surqo-text-secondary hover:bg-white/[0.05] hover:text-surqo-text"
                      )}
                    >
                      {label}
                    </Link>
                  )
                })}
                <div className="border-t border-white/[0.06] pt-3 mt-2 flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>Iniciar sesión</Link>
                  </Button>
                  <Button size="sm" className="w-full" asChild>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>Registrarse gratis</Link>
                  </Button>
                </div>
              </>
            )}

            {showAppNav && (
              <>
                {APP_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                      pathname.startsWith(href)
                        ? "bg-surqo-green/10 text-surqo-green border border-surqo-green/20"
                        : "text-surqo-text-secondary hover:bg-white/[0.05] hover:text-surqo-text"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
                <div className="border-t border-white/[0.06] pt-3 mt-2">
                  <button
                    onClick={() => { setMobileOpen(false); handleSignOut() }}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-surqo-text-secondary hover:text-surqo-danger hover:bg-surqo-danger/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}
