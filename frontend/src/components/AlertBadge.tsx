"use client"

import React from "react"
import type { Alert } from "@/types"

interface AlertBadgeProps {
  alert?: Alert
  // Support for flat props
  severity?: "info" | "warning" | "critical"
  message?: string
  time?: string
  onResolve?: (id: string) => void
}

const severityConfig = {
  info: {
    bar: "bg-surqo-sky",
    badge: "bg-surqo-sky/10 text-surqo-sky border-surqo-sky/20",
    card: "border-surqo-sky/15",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
  },
  warning: {
    bar: "bg-surqo-warning",
    badge: "bg-surqo-warning/10 text-surqo-warning border-surqo-warning/20",
    card: "border-surqo-warning/15 card-warning",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
      </svg>
    ),
  },
  critical: {
    bar: "bg-surqo-danger",
    badge: "bg-surqo-danger/10 text-surqo-danger border-surqo-danger/20",
    card: "border-surqo-danger/15 card-critical",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
    ),
  },
}

export function AlertBadge({ alert, severity, message, time, onResolve }: AlertBadgeProps) {
  const finalSeverity = alert?.severity || severity || "info"
  const finalMessage = alert?.title || message || "Sin mensaje"
  const finalTime = alert?.created_at ? new Date(alert.created_at).toLocaleString("es-CO") : time || ""
  const isResolved = alert?.is_resolved || false

  const cfg = severityConfig[finalSeverity as keyof typeof severityConfig] ?? severityConfig.info

  return (
    <div className={`glass rounded-xl border p-4 relative overflow-hidden ${cfg.card} ${isResolved ? "opacity-40" : ""}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${cfg.bar}`} />

      <div className="pl-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className={`mt-0.5 flex-shrink-0 p-1 rounded-md border ${cfg.badge}`}>
            {cfg.icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-sm text-surqo-text truncate">{finalMessage}</p>
              <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${cfg.badge}`}>
                {finalSeverity}
              </span>
            </div>
            {alert?.description && <p className="text-xs text-surqo-text-secondary leading-relaxed">{alert.description}</p>}
            {alert?.recommended_action && (
              <p className="text-xs text-surqo-green-bright mt-1.5 font-medium">
                → {alert.recommended_action}
              </p>
            )}
            <p className="text-[10px] text-surqo-text-muted mt-2">
              {finalTime}
              {alert?.response_time && ` · ${alert.response_time}`}
            </p>
          </div>
        </div>

        {!isResolved && onResolve && alert?.id && (
          <button
            onClick={() => onResolve(alert.id)}
            className="flex-shrink-0 text-xs px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-surqo-text-secondary hover:text-surqo-text rounded-lg transition-all duration-200"
          >
            Resolver
          </button>
        )}
      </div>
    </div>
  )
}
