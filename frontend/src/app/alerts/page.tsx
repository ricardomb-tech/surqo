"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertBadge } from "@/components/AlertBadge"
import { RequireAuth } from "@/components/RequireAuth"
import { Button } from "@/components/ui/Primitives"
import { farmAPI, alertAPI } from "@/lib/api"
import type { Alert } from "@/types"
import {
  ShieldAlert, CheckCircle2, Loader2, Search,
  AlertTriangle, XCircle, RefreshCcw, Clock,
} from "lucide-react"

function AlertsContent() {
  const [farmId, setFarmId] = useState<string | null>(null)
  const [active, setActive] = useState<Alert[]>([])
  const [resolved, setResolved] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [resolving, setResolving] = useState<string | null>(null)
  const [tab, setTab] = useState<"active" | "resolved">("active")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const farms = await farmAPI.list()
      if (!farms.length) { setLoading(false); return }
      const fid = farms[0].id
      setFarmId(fid)
      const [a, h] = await Promise.allSettled([alertAPI.active(fid), alertAPI.history(fid)])
      if (a.status === "fulfilled") setActive(a.value)
      if (h.status === "fulfilled") setResolved(h.value.filter((x) => x.is_resolved))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try { await alertAPI.resolve(id); await load() }
    finally { setResolving(null) }
  }

  const handleResolveAll = async () => {
    setResolving("all")
    try { await Promise.all(active.map((a) => alertAPI.resolve(a.id))); await load() }
    finally { setResolving(null) }
  }

  const criticalCount = active.filter((a) => a.severity === "critical").length
  const warningCount  = active.filter((a) => a.severity === "warning").length
  const infoCount     = active.filter((a) => a.severity === "info").length

  const list = (tab === "active" ? active : resolved).filter(
    (a) => !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.description?.toLowerCase().includes(query.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-surqo-green animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-16 bg-surqo-bg">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-surqo-danger" />
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-surqo-danger">
                Centro de Alertas
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-surqo-text">Protocolos de Alerta</h1>
            <p className="text-sm text-surqo-text-secondary font-medium mt-0.5">
              Eventos detectados por el sistema de monitoreo en tiempo real
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={load} className="gap-2 h-9">
              <RefreshCcw className="w-3.5 h-3.5" />
              Actualizar
            </Button>
            {active.length > 0 && (
              <Button size="sm" onClick={handleResolveAll} disabled={resolving === "all"} className="gap-2 h-9">
                {resolving === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Resolver todo
              </Button>
            )}
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-2xl border border-surqo-danger/20 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <XCircle className="w-4 h-4 text-surqo-danger" />
              <span className="text-xs font-bold text-surqo-danger uppercase tracking-widest">Críticas</span>
            </div>
            <p className="text-3xl font-black text-surqo-danger">{criticalCount}</p>
          </div>
          <div className="glass rounded-2xl border border-surqo-warning/20 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-surqo-warning" />
              <span className="text-xs font-bold text-surqo-warning uppercase tracking-widest">Advertencias</span>
            </div>
            <p className="text-3xl font-black text-surqo-warning">{warningCount}</p>
          </div>
          <div className="glass rounded-2xl border border-surqo-green/20 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-surqo-green" />
              <span className="text-xs font-bold text-surqo-green-bright uppercase tracking-widest">Info</span>
            </div>
            <p className="text-3xl font-black text-surqo-green">{infoCount}</p>
          </div>
        </div>

        {/* ── TABS + SEARCH ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-1 glass rounded-xl border border-white/[0.07] p-1">
            {(["active", "resolved"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  tab === t
                    ? "bg-surqo-green text-white"
                    : "text-surqo-text-secondary hover:text-surqo-text"
                }`}
              >
                {t === "active" ? `Activas (${active.length})` : `Resueltas (${resolved.length})`}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surqo-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar alerta…"
              className="w-full pl-9"
            />
          </div>
        </div>

        {/* ── LIST ── */}
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="glass rounded-2xl border border-dashed border-white/[0.10] py-16 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-surqo-green" />
              </div>
              <div>
                <p className="font-bold text-surqo-text">
                  {query ? "Sin resultados" : tab === "active" ? "Sin alertas activas" : "Sin alertas resueltas"}
                </p>
                <p className="text-sm text-surqo-text-secondary font-medium mt-1">
                  {!query && tab === "active" && "Tu finca está operando correctamente."}
                </p>
              </div>
            </div>
          ) : (
            list.map((a) => (
              <div key={a.id} className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="p-4 flex items-start gap-4">
                  <div className={`shrink-0 w-2 self-stretch rounded-full mt-1 ${
                    a.severity === "critical" ? "bg-surqo-danger"
                    : a.severity === "warning" ? "bg-surqo-warning"
                    : "bg-surqo-sky"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        a.severity === "critical"
                          ? "bg-surqo-danger/10 text-surqo-danger border-surqo-danger/20"
                          : a.severity === "warning"
                          ? "bg-surqo-warning/10 text-surqo-warning border-surqo-warning/20"
                          : "bg-surqo-sky/10 text-surqo-sky border-surqo-sky/20"
                      }`}>{a.severity}</span>
                      <p className="font-bold text-surqo-text text-sm">{a.title}</p>
                    </div>
                    {a.description && (
                      <p className="text-xs text-surqo-text-secondary leading-relaxed mb-1">{a.description}</p>
                    )}
                    {a.recommended_action && (
                      <p className="text-xs text-surqo-green-bright font-medium">→ {a.recommended_action}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-surqo-text-muted font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleString("es-CO", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                      {a.response_time && <span className="ml-2 opacity-60">· {a.response_time}</span>}
                    </div>
                  </div>
                  {!a.is_resolved && (
                    <button
                      onClick={() => handleResolve(a.id)}
                      disabled={!!resolving}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-surqo-text-secondary hover:text-surqo-green hover:border-surqo-green/30 hover:bg-surqo-green/5 transition-all"
                    >
                      {resolving === a.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : "Resolver"}
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

export default function AlertsPage() {
  return <RequireAuth><AlertsContent /></RequireAuth>
}
