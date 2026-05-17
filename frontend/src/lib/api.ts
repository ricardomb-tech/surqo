import type { Analysis, Alert, Farm, KPIs, SensorReading, TimeseriesPoint } from "@/types"
import { getAccessToken } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo.onrender.com"

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }))
    throw new Error(err.detail || `API error: ${resp.status}`)
  }
  return resp.json()
}

// Farms
export const farmAPI = {
  list: () => fetchJSON<Farm[]>("/api/v1/farms/"),
  get: (id: string) => fetchJSON<Farm>(`/api/v1/farms/${id}`),
  create: (data: Partial<Farm>) =>
    fetchJSON<Farm>("/api/v1/farms/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  kpis: (id: string) => fetchJSON<KPIs>(`/api/v1/farms/${id}/kpis`),
}

// Analysis
export const analysisAPI = {
  analyze: (data: {
    farm_name: string
    lat: number
    lon: number
    crop_type: string
    farm_id?: string
    alert_email?: string
  }) =>
    fetchJSON<Analysis>("/api/v1/analysis/analyze", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  history: (farmId: string) =>
    fetchJSON<Analysis[]>(`/api/v1/analysis/history/${farmId}`),
  get: (id: string) => fetchJSON<Analysis>(`/api/v1/analysis/${id}`),
}

// Sensors
export const sensorAPI = {
  latest: (deviceId: string) =>
    fetchJSON<SensorReading>(`/api/v1/sensors/latest/${deviceId}`),
  timeseries: (farmId: string, hours = 24, metric = "soil_moisture_pct") =>
    fetchJSON<TimeseriesPoint[]>(
      `/api/v1/sensors/timeseries/${farmId}?hours=${hours}&metric=${metric}`
    ),
  stats: (farmId: string) =>
    fetchJSON<Record<string, unknown>>(`/api/v1/sensors/stats/${farmId}`),
}

// Alerts
export const alertAPI = {
  active: (farmId?: string) =>
    fetchJSON<Alert[]>(
      `/api/v1/alerts/active${farmId ? `?farm_id=${farmId}` : ""}`
    ),
  history: (farmId?: string) =>
    fetchJSON<Alert[]>(
      `/api/v1/alerts/history${farmId ? `?farm_id=${farmId}` : ""}`
    ),
  resolve: (id: string) =>
    fetchJSON<Alert>(`/api/v1/alerts/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ resolved: true }),
    }),
}

// KPIs
export const kpiAPI = {
  farm: (farmId: string) => fetchJSON<KPIs>(`/api/v1/kpis/farm/${farmId}`),
  vpdHistory: (farmId: string) =>
    fetchJSON<{ timestamp: string; vpd_kpa: number }[]>(
      `/api/v1/kpis/farm/${farmId}/vpd-history`
    ),
  pestRisk: (farmId: string) =>
    fetchJSON<Record<string, unknown>>(`/api/v1/kpis/farm/${farmId}/pest-risk`),
}
