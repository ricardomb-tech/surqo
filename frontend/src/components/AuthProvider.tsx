"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface PlanLimits {
  plan: string
  farms: { used: number; limit: number | null; unlimited: boolean; remaining?: number }
  ai_analysis: { allowed: boolean }
  email_alerts: { unlimited: boolean }
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  planLimits: PlanLimits | null
  refreshPlanLimits: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  planLimits: null,
  refreshPlanLimits: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev"

async function fetchPlanLimits(token: string): Promise<PlanLimits | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/me/plan-limits`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const INACTIVITY_MS = 15 * 60 * 1000 // 15 minutos

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null)

  const refreshPlanLimits = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) {
      const limits = await fetchPlanLimits(data.session.access_token)
      setPlanLimits(limits)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (data.session?.access_token) {
        fetchPlanLimits(data.session.access_token).then(setPlanLimits)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.access_token) {
        fetchPlanLimits(newSession.access_token).then(setPlanLimits)
      } else {
        setPlanLimits(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Cierre de sesión por inactividad
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          await supabase.auth.signOut()
          setPlanLimits(null)
          window.location.href = "/login?reason=inactivity"
        }
      }, INACTIVITY_MS)
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setPlanLimits(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        planLimits,
        refreshPlanLimits,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
