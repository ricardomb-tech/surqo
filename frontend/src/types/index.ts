export type AlertLevel = "ok" | "warning" | "critical"
export type Trend = "up" | "down" | "stable"

export interface Farm {
  id: string
  name: string
  owner_name: string | null
  owner_email: string | null
  latitude: number
  longitude: number
  crop_type: string
  area_hectares: number | null
  altitude_masl: number | null
  department: string
  municipality: string | null
  is_active: boolean
  created_at: string
}

export interface SensorReading {
  id: string
  device_id: string
  farm_id: string | null
  soil_moisture_pct: number | null
  soil_temp_c: number | null
  air_temp_c: number | null
  air_humidity_pct: number | null
  uv_index: number | null
  battery_mv: number | null
  rssi_dbm: number | null
  vpd_kpa: number | null
  source: string
  firmware_version: string | null
  created_at: string
}

export interface Recommendation {
  priority: number
  category: string
  action: string
  time_window: string
  justification: string
}

export interface Analysis {
  id: string
  farm_name: string
  crop_type: string
  alert_level: AlertLevel
  main_alert: string | null
  water_stress_index: number | null
  irrigation_needed: boolean
  next_irrigation_date: string | null
  avg_temperature_c: number | null
  total_rain_7d_mm: number | null
  avg_vpd_kpa: number | null
  et0_7d_mm: number | null
  recommendations: Recommendation[] | null
  summary_for_farmer: string | null
  model_used: string
  input_tokens: number | null
  output_tokens: number | null
  cost_usd: number | null
  created_at: string
}

export interface Alert {
  id: string
  farm_id: string | null
  device_id: string | null
  alert_type: string
  severity: string
  title: string
  description: string
  recommended_action: string | null
  response_time: string | null
  is_resolved: boolean
  resolved_at: string | null
  email_sent: boolean
  created_at: string
}

export interface TimeseriesPoint {
  timestamp: string
  value: number | null
}

export interface KPIs {
  vpd_kpa: number
  avg_air_temp_c: number
  avg_humidity_pct: number
  avg_soil_moisture_pct: number
  soil_health_score: number
  pest_risk: {
    risk_pct: number
    pathogens: string[]
    conditions: string
  }
  readings_count_24h: number
  latest_reading_at: string | null
}
