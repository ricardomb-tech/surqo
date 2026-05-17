"use client"

import React from "react"
import type { Analysis } from "@/types"

interface AnalysisResultProps {
  analysis?: Analysis
}

const dummyAnalysis: Analysis = {
  id: "demo",
  farm_name: "Finca La Esperanza",
  crop_type: "Maíz",
  alert_level: "ok",
  main_alert: null,
  summary_for_farmer: "Las condiciones son óptimas. El VPD se mantiene bajo control y el suelo tiene humedad suficiente para las próximas 48 horas.",
  irrigation_needed: false,
  next_irrigation_date: null,
  water_stress_index: 1.2,
  avg_temperature_c: 28.5,
  total_rain_7d_mm: 12,
  avg_vpd_kpa: 0.95,
  et0_7d_mm: null,
  recommendations: [
    { action: "Mantener monitoreo", time_window: "24h", justification: "Condiciones estables", category: "general", priority: 1 }
  ],
  model_used: "Claude 3.5 Sonnet",
  input_tokens: null,
  output_tokens: null,
  cost_usd: null,
  created_at: new Date().toISOString(),
}

const alertConfig = {
  ok: {
    border: "border-surqo-green/20",
    bg: "bg-surqo-green/5",
    badge: "bg-surqo-green/10 text-surqo-green-bright border-surqo-green/20",
    label: "Sin alertas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-surqo-green">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
      </svg>
    ),
  },
  warning: {
    border: "border-surqo-warning/20",
    bg: "bg-surqo-warning/5",
    badge: "bg-surqo-warning/10 text-surqo-warning border-surqo-warning/20",
    label: "Advertencia",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-surqo-warning">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
      </svg>
    ),
  },
  critical: {
    border: "border-surqo-danger/20",
    bg: "bg-surqo-danger/5",
    badge: "bg-surqo-danger/10 text-surqo-danger border-surqo-danger/20",
    label: "Crítico",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-surqo-danger">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
  },
}

const categoryIcon: Record<string, React.ReactNode> = {
  irrigation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
  fertilization: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V12m0 0C12 7 7 4 7 4s5 3 5 8m0 0c0-5 5-8 5-8s-5 3-5 8"/></svg>,
  pest_control: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
  harvest: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
  general: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
}

export function AnalysisResult({ analysis = dummyAnalysis }: AnalysisResultProps) {
  const cfg = alertConfig[analysis.alert_level as keyof typeof alertConfig] ?? alertConfig.ok

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className={`rounded-xl border p-4 ${cfg.border} ${cfg.bg}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg border ${cfg.border} ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-surqo-text">{cfg.label}</p>
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${cfg.badge}`}>
                {analysis.alert_level}
              </span>
              {analysis.irrigation_needed && (
                <span className="text-[10px] font-semibold bg-surqo-sky/10 text-surqo-sky border border-surqo-sky/20 px-1.5 py-0.5 rounded">
                  Riego necesario
                </span>
              )}
            </div>
            <p className="text-xs text-surqo-text-muted mt-0.5">
              {analysis.farm_name} · {analysis.crop_type}
            </p>
          </div>
        </div>

        {analysis.summary_for_farmer && (
          <p className="text-sm text-surqo-text-secondary leading-relaxed border-t border-white/[0.06] pt-3 italic">
            "{analysis.summary_for_farmer}"
          </p>
        )}
      </div>

      {/* KPI mini-grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Estrés hídrico", value: analysis.water_stress_index?.toFixed(1), unit: "/10" },
          { label: "Temp. promedio", value: analysis.avg_temperature_c?.toFixed(1), unit: "°C" },
          { label: "Lluvia 7 días", value: analysis.total_rain_7d_mm?.toFixed(0), unit: "mm" },
          { label: "VPD promedio", value: analysis.avg_vpd_kpa?.toFixed(2), unit: "kPa" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass rounded-lg border border-white/[0.07] p-3 text-center">
            <p className="text-base font-bold text-surqo-text data-value">
              {kpi.value ?? "—"}<span className="text-xs text-surqo-text-muted ml-0.5">{kpi.unit}</span>
            </p>
            <p className="text-[10px] text-surqo-text-muted mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-surqo-text-secondary uppercase tracking-widest mb-3">
            Recomendaciones
          </h3>
          <div className="space-y-2">
            {analysis.recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="glass rounded-lg border border-white/[0.07] p-3 flex gap-3 hover:border-surqo-green/15 transition-colors">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green mt-0.5">
                  {categoryIcon[rec.category] ?? categoryIcon.general}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surqo-text">{rec.action}</p>
                  <p className="text-xs text-surqo-text-muted mt-0.5">
                    {rec.time_window} · {rec.justification}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[10px] font-bold bg-white/[0.04] text-surqo-text-muted px-2 py-0.5 h-fit rounded-full border border-white/[0.06]">
                  #{rec.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
