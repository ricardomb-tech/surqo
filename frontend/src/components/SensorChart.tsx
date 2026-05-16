"use client"

import React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { TimeseriesPoint } from "@/types"

interface SensorChartProps {
  data?: TimeseriesPoint[]
  metric?: string
  unit?: string
  color?: string
}

const dummyData: TimeseriesPoint[] = Array.from({ length: 12 }, (_, i) => ({
  timestamp: new Date(Date.now() - (11 - i) * 3600000).toISOString(),
  value: 20 + Math.random() * 10,
}))

function CustomTooltip({ active, payload, label, unit }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surqo-bg-elevated border border-white/10 rounded-lg px-3 py-2 shadow-card">
      <p className="text-[11px] text-surqo-text-muted mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-surqo-green-bright data-value">
        {payload[0].value} {unit}
      </p>
    </div>
  )
}

export function SensorChart({ data = dummyData, metric = "Valor", unit = "", color = "#22C55E" }: SensorChartProps) {
  const chartData = data.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    value: p.value !== null ? Number(p.value.toFixed(1)) : null,
  }))

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 text-surqo-text-muted">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30">
          <path d="M3 3v18h18M7 16l4-4 4 4 4-4"/>
        </svg>
        <span className="text-xs">Sin datos para mostrar</span>
      </div>
    )
  }

  const gradientId = `gradient-${color.replace("#", "")}`

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.06)" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "rgba(240,253,244,0.25)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "rgba(240,253,244,0.25)" }}
          tickLine={false}
          axisLine={false}
          unit={unit}
          width={42}
        />
        <Tooltip
          content={<CustomTooltip unit={unit} />}
          cursor={{ stroke: "rgba(34,197,94,0.2)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
