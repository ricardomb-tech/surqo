"use client"

import { AppSidebar } from "@/components/AppSidebar"
import { RequireAuth } from "@/components/RequireAuth"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ background: "#f4f7f4" }}>
        <AppSidebar />
        <main className="flex-1 pl-16 min-h-screen">
          {children}
        </main>
      </div>
    </RequireAuth>
  )
}
