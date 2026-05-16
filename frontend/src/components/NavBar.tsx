"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Zap, LayoutDashboard, Activity, Bell, FlaskConical, Sprout, CrownIcon, Menu, X, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/Primitives"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sensors", label: "Sensores", icon: Activity },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/analyze", label: "Análisis IA", icon: FlaskConical },
  { href: "/farms", label: "Fincas", icon: Sprout },
]

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, planLimits, isPaid, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-surqo-bg/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <Zap className="w-5 h-5 text-surqo-green group-hover:text-surqo-green-bright transition-colors" />
          <span className="text-lg font-black tracking-tighter text-gradient">SURQO</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                pathname.startsWith(href)
                  ? "bg-surqo-green/10 text-surqo-green-bright"
                  : "text-surqo-text-secondary hover:text-surqo-text hover:bg-white/5"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-20 h-8 rounded-xl bg-white/5 animate-pulse" />
          ) : user ? (
            <>
              {/* Plan badge */}
              {!isPaid && (
                <Link
                  href="/upgrade"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <CrownIcon className="w-3 h-3" />
                  Free
                </Link>
              )}
              {isPaid && (
                <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-surqo-green/10 text-surqo-green-bright border border-surqo-green/20">
                  <CrownIcon className="w-3 h-3" />
                  Pro
                </span>
              )}

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-surqo-text-secondary hover:text-surqo-text hover:bg-white/5 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-surqo-green/20 border border-surqo-green/30 flex items-center justify-center text-xs font-black text-surqo-green-bright">
                    {user.email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate text-xs">
                    {user.email}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 z-50 glass rounded-2xl border border-white/10 p-1.5 shadow-xl">
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <p className="text-xs font-bold text-surqo-text truncate">{user.email}</p>
                        <p className="text-xs text-surqo-text-muted mt-0.5">
                          Plan {isPaid ? "Pro" : "Gratuito"}
                          {!isPaid && planLimits && (
                            <span className="ml-1">· {planLimits.farms.used}/{planLimits.farms.limit} fincas</span>
                          )}
                        </p>
                      </div>
                      {!isPaid && (
                        <Link
                          href="/upgrade"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <CrownIcon className="w-4 h-4" />
                          Actualizar a Pro
                        </Link>
                      )}
                      <button
                        onClick={() => { setUserMenuOpen(false); handleSignOut() }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-surqo-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
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

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-xl text-surqo-text-secondary hover:text-surqo-text hover:bg-white/5 transition-all"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-surqo-bg/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                pathname.startsWith(href)
                  ? "bg-surqo-green/10 text-surqo-green-bright"
                  : "text-surqo-text-secondary hover:text-surqo-text hover:bg-white/5"
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
