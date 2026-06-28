"use client"

import { useState, useEffect, useCallback } from "react"
import { farmAPI, alertAPI } from "@/lib/api"
import type { Alert } from "@/types"
import { ShieldAlert, CheckCircle2, Loader2, Search, AlertTriangle, XCircle, RefreshCcw, Clock } from "lucide-react"
import { Button } from "@/components/ui/Primitives"

export default function AlertsPage() {
  const [active,    setActive]    = useState<Alert[]>([])
  const [resolved,  setResolved]  = useState<Alert[]>([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState("")
  const [resolving, setResolving] = useState<string | null>(null)
  const [tab,       setTab]       = useState<"active" | "resolved">("active")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const farms = await farmAPI.list()
      if (!farms.length) { setLoading(false); return }
      const fid = farms[0].id
      const [a, h] = await Promise.allSettled([alertAPI.active(fid), alertAPI.history(fid)])
      if (a.status === "fulfilled") setActive(a.value)
      if (h.status === "fulfilled") setResolved(h.value.filter((x) => x.is_resolved))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try { await alertAPI.resolve(id); await load() } finally { setResolving(null) }
  }

  const handleResolveAll = async () => {
    setResolving("all")
    try { await Promise.all(active.map((a) => alertAPI.resolve(a.id))); await load() } finally { setResolving(null) }
  }

  const criticalCount = active.filter((a) => a.severity === "critical").length
  const warningCount  = active.filter((a) => a.severity === "warning").length
  const infoCount     = active.filter((a) => a.severity === "info").length

  const list = (tab === "active" ? active : resolved).filter(
    (a) => !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.description?.toLowerCase().includes(query.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen pb-16">
      {/* Top bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-30"
        style={{ background: "#ffffff", borderColor: "#e8f0e8" }}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-red-500">Centro de Alertas</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-semibold text-gray-700 text-sm">Protocolos de Alerta</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2 h-9">
            <RefreshCcw className="w-3.5 h-3.5" />Actualizar
          </Button>
          {active.length > 0 && (
            <Button size="sm" onClick={handleResolveAll} disabled={resolving === "all"} className="gap-2 h-9">
              {resolving === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Resolver todo
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Protocolos de Alerta</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Críticas",      count: criticalCount, color: "#dc2626", bg: "#fff1f1", border: "#fecaca", icon: <XCircle className="w-4 h-4" /> },
            { label: "Advertencias",  count: warningCount,  color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <AlertTriangle className="w-4 h-4" /> },
            { label: "Info",          count: infoCount,     color: "#16a34a", bg: "#f0faf0", border: "#c8e8c8", icon: <CheckCircle2 className="w-4 h-4" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center"
              style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: s.color }}>
                {s.icon}
                <span className="text-xs font-bold uppercase tracking-widest">{s.label}</span>
              </div>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {(["active", "resolved"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  tab === t ? "text-white" : "text-gray-400 hover:text-gray-700"
                }`}
                style={tab === t ? { background: "#86E66A", color: "#0f1f0f" } : {}}>
                {t === "active" ? `Activas (${active.length})` : `Resueltas (${resolved.length})`}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar alerta…" className="w-full pl-9" style={{ background: "#ffffff", border: "1px solid #e8f0e8" }} />
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-16 flex flex-col items-center gap-4 text-center bg-white">
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800">{query ? "Sin resultados" : tab === "active" ? "Sin alertas activas" : "Sin alertas resueltas"}</p>
                {!query && tab === "active" && <p className="text-sm text-gray-400 font-medium mt-1">Tu finca está operando correctamente.</p>}
              </div>
            </div>
          ) : (
            list.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-white overflow-hidden"
                style={{
                  borderColor: a.severity === "critical" ? "#fecaca" : a.severity === "warning" ? "#fde68a" : "#c8e8c8",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                <div className="p-4 flex items-start gap-4">
                  <div className={`shrink-0 w-1.5 self-stretch rounded-full`}
                    style={{ background: a.severity === "critical" ? "#dc2626" : a.severity === "warning" ? "#d97706" : "#3b82f6" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                        style={{
                          background: a.severity === "critical" ? "#fff1f1" : a.severity === "warning" ? "#fffbeb" : "#eff6ff",
                          color: a.severity === "critical" ? "#dc2626" : a.severity === "warning" ? "#d97706" : "#3b82f6",
                          borderColor: a.severity === "critical" ? "#fecaca" : a.severity === "warning" ? "#fde68a" : "#bfdbfe",
                        }}>
                        {a.severity}
                      </span>
                      <p className="font-bold text-gray-900 text-sm">{a.title}</p>
                    </div>
                    {a.description && <p className="text-xs text-gray-500 leading-relaxed mb-1">{a.description}</p>}
                    {a.recommended_action && <p className="text-xs text-green-700 font-medium">→ {a.recommended_action}</p>}
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {!a.is_resolved && (
                    <button onClick={() => handleResolve(a.id)} disabled={!!resolving}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:text-green-700 hover:border-green-300 hover:bg-green-50"
                      style={{ border: "1px solid #e8f0e8", color: "#6b7280" }}>
                      {resolving === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Resolver"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
