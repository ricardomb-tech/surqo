"use client"

import { useState, useEffect, useCallback } from "react"
import { Button, Card } from "@/components/ui/Primitives"
import { AlertBadge } from "@/components/AlertBadge"
import { ShieldAlert, History, Search, CheckCircle2, Loader2 } from "lucide-react"
import { RequireAuth } from "@/components/RequireAuth"
import { farmAPI, alertAPI } from "@/lib/api"
import type { Alert } from "@/types"

function AlertsContent() {
  const [farmId, setFarmId] = useState<string | null>(null)
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([])
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [resolving, setResolving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const farms = await farmAPI.list()
      if (farms.length === 0) { setLoading(false); return }
      const fid = farms[0].id
      setFarmId(fid)
      const [active, history] = await Promise.allSettled([
        alertAPI.active(fid),
        alertAPI.history(fid),
      ])
      if (active.status === "fulfilled") setActiveAlerts(active.value)
      if (history.status === "fulfilled") {
        setResolvedAlerts(history.value.filter((a) => a.is_resolved).slice(0, 5))
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await alertAPI.resolve(id)
      await load()
    } finally {
      setResolving(null)
    }
  }

  const handleResolveAll = async () => {
    setResolving("all")
    try {
      await Promise.all(activeAlerts.map((a) => alertAPI.resolve(a.id)))
      await load()
    } finally {
      setResolving(null)
    }
  }

  const filtered = activeAlerts.filter(
    (a) =>
      !query ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase())
  )

  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surqo-danger/10 border border-surqo-danger/20 text-surqo-danger text-xs font-bold uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3" />
              Gestión de Riesgos
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gradient leading-tight">
              Protocolos de Alerta
            </h1>
            <p className="text-surqo-text-secondary max-w-xl font-medium">
              Histórico y gestión de eventos críticos detectados por el sistema de monitoreo inteligente.
            </p>
          </div>

          {activeAlerts.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={handleResolveAll}
              disabled={resolving === "all"}
            >
              {resolving === "all"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />}
              Resolver Todo
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">

          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black tracking-tight flex items-center gap-2">
                <History className="w-5 h-5 text-surqo-green" />
                Alertas Activas
              </h3>
              <span className="text-[10px] font-bold text-surqo-text-muted uppercase tracking-widest bg-black/5 px-2 py-1 rounded-md">
                {activeAlerts.length} activas
              </span>
            </div>

            {filtered.length === 0 && !query && (
              <Card className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-surqo-green mx-auto mb-3" />
                <p className="font-bold text-surqo-text">Sin alertas activas</p>
                <p className="text-sm text-surqo-text-secondary mt-1">Tu finca está operando correctamente.</p>
              </Card>
            )}

            <div className="space-y-4">
              {filtered.map((a) => (
                <div key={a.id} className="relative">
                  <AlertBadge
                    severity={a.severity as "critical" | "warning" | "info"}
                    message={a.title}
                    time={new Date(a.created_at).toLocaleString("es-CO", {
                      dateStyle: "short", timeStyle: "short"
                    })}
                    alert={a}
                  />
                  <button
                    onClick={() => handleResolve(a.id)}
                    disabled={!!resolving}
                    className="absolute right-3 top-3 text-xs text-surqo-text-muted hover:text-surqo-green transition-colors font-bold px-2 py-1 rounded-lg hover:bg-surqo-green/10"
                  >
                    {resolving === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Resolver"}
                  </button>
                </div>
              ))}
            </div>

            {resolvedAlerts.length > 0 && (
              <div className="pt-8 opacity-60">
                <h4 className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-4">
                  Resueltas recientemente
                </h4>
                {resolvedAlerts.map((a) => (
                  <AlertBadge
                    key={a.id}
                    severity={a.severity as "critical" | "warning" | "info"}
                    message={a.title}
                    time={a.resolved_at
                      ? new Date(a.resolved_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
                      : ""}
                    alert={a}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surqo-text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar alertas..."
                  className="w-full pl-10"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest">Resumen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-surqo-danger/5 border border-surqo-danger/10">
                    <p className="text-2xl font-black text-surqo-danger">{criticalCount}</p>
                    <p className="text-[10px] font-bold text-surqo-danger/60 uppercase">Críticas</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surqo-warning/5 border border-surqo-warning/10">
                    <p className="text-2xl font-black text-surqo-warning">{warningCount}</p>
                    <p className="text-[10px] font-bold text-surqo-warning/60 uppercase">Advertencias</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  return (
    <RequireAuth>
      <AlertsContent />
    </RequireAuth>
  )
}
