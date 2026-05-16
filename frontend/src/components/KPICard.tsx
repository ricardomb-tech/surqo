"use client"

import React from "react"
import type { AlertLevel, Trend } from "@/types"

interface KPICardProps {
  title: string
  value: number | string | null
  unit: string
  trend?: Trend
  alertLevel?: AlertLevel
  status?: AlertLevel // Alias for alertLevel to support modern usage
  icon: React.ReactNode // Support both strings and SVGs
  description?: string
}

const alertConfig: Record<AlertLevel, { card: string; badge: string; valueColor: string }> = {
  ok: {
    card: "card-ok",
    badge: "bg-surqo-green/10 text-surqo-green-bright border-surqo-green/20",
    valueColor: "text-surqo-text",
  },
  warning: {
    card: "card-warning",
    badge: "bg-surqo-warning/10 text-surqo-warning border-surqo-warning/20",
    valueColor: "text-surqo-warning",
  },
  critical: {
    card: "card-critical",
    badge: "bg-surqo-danger/10 text-surqo-danger border-surqo-danger/20",
    valueColor: "text-surqo-danger",
  },
}

const trendConfig: Record<Trend, { icon: string; color: string }> = {
  up: { icon: "↑", color: "text-surqo-green" },
  down: { icon: "↓", color: "text-surqo-danger" },
  stable: { icon: "→", color: "text-surqo-text-muted" },
}

export function KPICard({
  title,
  value,
  unit,
  trend,
  alertLevel,
  status,
  icon,
  description,
}: KPICardProps) {
  const finalAlertLevel = status || alertLevel || "ok"
  const cfg = alertConfig[finalAlertLevel]
  const trendCfg = trend ? trendConfig[trend] : null

  return (
    <div
      className={`glass rounded-2xl border p-5 relative overflow-hidden group cursor-default transition-all duration-500 hover:-translate-y-1 hover:shadow-glow-md scan-container ${cfg.card}`}
    >
      {description && (
        <div className="absolute bottom-[90%] left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-surqo-bg-elevated/90 backdrop-blur-md border border-white/10 text-surqo-text text-[11px] rounded-xl px-4 py-2.5 max-w-[200px] z-20 pointer-events-none shadow-glow-lg text-center leading-relaxed">
          {description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-surqo-bg-elevated/90" />
        </div>
      )}

      {/* Shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
        <div className="shimmer w-full h-full" />
      </div>

      {/* Scanning Line */}
      <div className="scan-line" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xl shadow-inner-glow group-hover:border-surqo-green/30 transition-colors duration-300">
            {typeof icon === "string" ? icon : <div className="text-surqo-green">{icon}</div>}
          </div>
          {finalAlertLevel !== "ok" && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${cfg.badge} animate-pulse-slow`}>
              {finalAlertLevel}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className={`text-3xl font-extrabold data-value tracking-tight ${cfg.valueColor}`}>
            {value !== null && value !== undefined ? value : "—"}
          </span>
          <span className="text-sm font-medium text-surqo-text-muted">{unit}</span>
          {trendCfg && (
            <span className={`text-base font-bold ml-1 ${trendCfg.color}`}>
              {trendCfg.icon}
            </span>
          )}
        </div>

        <p className="text-[13px] font-semibold text-surqo-text-secondary group-hover:text-surqo-text transition-colors duration-300">{title}</p>
      </div>
    </div>
  )
}
