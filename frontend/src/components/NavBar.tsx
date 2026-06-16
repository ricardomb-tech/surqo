"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Activity, Bell,
  FlaskConical, Sprout, Menu, X, LogOut, ChevronDown,
} from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { SurqoIcon } from "@/components/SurqoIcon"
import { Button } from "@/components/ui/Primitives"
import { GlassButton } from "@/components/ui/glass-button"
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

const LIME = "#86E66A"

// ── Component ────────────────────────────────────────────────────────────────

export function NavBar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, loading, signOut } = useAuth()

  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled,     setScrolled]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isPublicPage = PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  )
  const showAppNav    = !!user && !isPublicPage
  const showPublicNav = !user && isPublicPage

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const isHome = pathname === "/"
  // Light pill mode = scrolled or not on homepage
  const isLight = !isHome || scrolled

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 flex justify-center",
          scrolled ? "pt-4 px-6 pointer-events-none" : "pointer-events-auto"
        )}
      >
        <div
          className={cn(
            "pointer-events-auto w-full flex items-center justify-between gap-4 px-6 transition-all duration-300",
            scrolled ? "max-w-5xl h-16 rounded-2xl" : "max-w-6xl h-20"
          )}
          style={
            !scrolled
              ? { background: "transparent" }
              : {
                  background: "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 100%)",
                  border: "1px solid rgba(255,255,255,0.50)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(0,0,0,0.06)",
                  backdropFilter: "blur(16px) saturate(160%)",
                  WebkitBackdropFilter: "blur(16px) saturate(160%)",
                }
          }
        >

          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 shrink-0 group"
          >
            <SurqoIcon className={cn("w-9 h-9 group-hover:scale-110 transition-transform", isLight ? "text-surqo-green" : "text-white")} />
            <span className={cn("text-2xl font-black tracking-tighter", isLight ? "text-gray-900" : "text-white")}>SURQO</span>
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
                      "relative text-sm font-black tracking-widest uppercase transition-colors duration-200",
                      isLight
                        ? active
                          ? "text-gray-900 bg-white/40 backdrop-blur-sm border border-white/60 px-4 py-1.5 rounded-full shadow-sm"
                          : "text-gray-500 hover:text-gray-900 px-4 py-2"
                        : active
                          ? "text-white px-4 py-2"
                          : "text-white hover:text-[#86E66A] px-4 py-2"
                    )}
                  >
                    {label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                        style={{ background: LIME }}
                      />
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
                      ? "text-white border border-white/20"
                      : "text-white/60 hover:text-white hover:bg-white/[0.06]"
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
              <div className="w-20 h-8 rounded-xl bg-white/10 animate-pulse" />
            ) : user ? (
              /* User menu */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <div
                    className="w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black"
                    style={{ borderColor: LIME, color: LIME, background: "rgba(134,230,106,0.10)" }}
                  >
                    {user.email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate text-xs font-medium text-white/80">
                    {user.email}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-2 w-52 z-50 rounded-2xl p-1.5 shadow-2xl"
                      style={{
                        background: "rgba(8,20,8,0.88)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user.email}</p>
                        <p className="text-xs text-white/40 mt-0.5 font-medium">Plataforma Surqo</p>
                      </div>
                      <button
                        onClick={() => { setUserMenuOpen(false); handleSignOut() }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <GlassButton size="sm" contentClassName="flex items-center gap-1.5 font-black tracking-widest uppercase">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    Login
                  </GlassButton>
                </Link>
                <Link href="/register">
                  <GlassButton size="sm" contentClassName="font-black tracking-widest uppercase" style={{ color: LIME } as React.CSSProperties}>
                    Empezar gratis
                  </GlassButton>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            {(showPublicNav || showAppNav) && (
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden p-2 rounded-xl text-white/70 hover:bg-white/[0.08] transition-all"
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
          <div
            className="fixed top-20 inset-x-0 z-50 md:hidden px-4 py-4 flex flex-col gap-1"
            style={{
              background: "rgba(8,20,8,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
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
                        "flex items-center px-4 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all",
                        active ? "text-white" : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                      )}
                      style={active ? { color: LIME } : {}}
                    >
                      {label}
                    </Link>
                  )
                })}
                <div className="border-t border-white/10 pt-3 mt-2 flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center font-black text-sm tracking-widest uppercase px-5 py-3 rounded-full text-white/70 border border-white/20 hover:border-white/50 transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center font-black text-sm tracking-widest uppercase px-5 py-3 rounded-full transition-all"
                    style={{ border: `2px solid ${LIME}`, color: LIME }}
                  >
                    Empezar gratis
                  </Link>
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
                        ? "text-white border border-white/20"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
                <div className="border-t border-white/10 pt-3 mt-2">
                  <button
                    onClick={() => { setMobileOpen(false); handleSignOut() }}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
