"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard, Activity, Bell,
  FlaskConical, Sprout, LogOut, ChevronRight, UserCircle2,
} from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { SurqoIcon } from "@/components/SurqoIcon"
import { cn } from "@/lib/utils"
import { getAccessToken } from "@/lib/auth"

const LIME = "#86E66A"
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev"

const NAV = [
  { href: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
  { href: "/sensors",   label: "Sensores",    icon: Activity },
  { href: "/alerts",    label: "Alertas",     icon: Bell },
  { href: "/analyze",   label: "Análisis IA", icon: FlaskConical },
  { href: "/farms",     label: "Fincas",      icon: Sprout },
  { href: "/profile",   label: "Mi perfil",   icon: UserCircle2 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, signOut } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getAccessToken().then((token) =>
      fetch(`${API_BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } })
    ).then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setAvatarUrl(d.avatar_url); setDisplayName(d.full_name) } })
      .catch(() => {})
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out",
        expanded ? "w-56" : "w-16"
      )}
      style={{
        background: "#ffffff",
        borderRight: "1px solid #e8f0e8",
        boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-100 shrink-0 overflow-hidden">
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          <SurqoIcon className="w-8 h-8 shrink-0 text-[#86E66A]" />
          <span
            className={cn(
              "text-lg font-black tracking-tight text-gray-900 whitespace-nowrap transition-all duration-300",
              expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            SURQO
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 group relative",
                active
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-700"
              )}
              style={active ? { background: `${LIME}20` } : {}}
            >
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                  style={{ background: LIME }}
                />
              )}
              <Icon
                className="w-5 h-5 shrink-0 transition-colors"
                style={active ? { color: "#3a7a1a" } : {}}
              />
              <span
                className={cn(
                  "text-sm font-semibold whitespace-nowrap transition-all duration-300",
                  expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}
              >
                {label}
              </span>

              {/* Tooltip when collapsed */}
              {!expanded && (
                <div
                  className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                  style={{ background: "#1a2e1a" }}
                >
                  {label}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent" style={{ borderRightColor: "#1a2e1a" }} />
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Expand hint */}
      <div className={cn(
        "flex items-center justify-center h-8 transition-all duration-300",
        expanded ? "opacity-0" : "opacity-40"
      )}>
        <ChevronRight className="w-3 h-3 text-gray-400" />
      </div>

      {/* User + sign out */}
      <div className="px-2 pb-4 border-t border-gray-100 pt-3 space-y-1 overflow-hidden">
        {/* User chip */}
        <Link href="/profile" className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar"
              className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
              style={{ background: `${LIME}30`, color: "#2d6e10", border: `1.5px solid ${LIME}60` }}
            >
              {(displayName ?? user?.email ?? "U")[0].toUpperCase()}
            </div>
          )}
          <span
            className={cn(
              "text-xs font-medium text-gray-500 truncate max-w-[120px] transition-all duration-300",
              expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            {displayName || user?.email}
          </span>
        </Link>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          <span
            className={cn(
              "text-sm font-semibold whitespace-nowrap transition-all duration-300",
              expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            Cerrar sesión
          </span>

          {!expanded && (
            <div
              className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
              style={{ background: "#1a2e1a" }}
            >
              Cerrar sesión
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
