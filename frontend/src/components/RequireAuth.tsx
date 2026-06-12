"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading, planLimits } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const planLoaded = planLimits !== null
  const noFarm = planLoaded && planLimits.farms.used === 0
  const needsOnboarding = !!user && noFarm && pathname !== "/onboarding"

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`)
      return
    }
    if (needsOnboarding) {
      router.replace("/onboarding")
    }
  }, [loading, user, needsOnboarding, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
      </div>
    )
  }

  if (!user) return null
  if (needsOnboarding) return null

  return <>{children}</>
}
