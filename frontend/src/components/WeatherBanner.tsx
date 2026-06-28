"use client"

import { useEffect, useState } from "react"
import { Loader2, CloudRain, Sun, Cloud, Wind, Thermometer, Droplets, CloudLightning } from "lucide-react"

interface WeatherData {
  temp: number
  feelsLike: number
  rainProb: number
  windSpeed: number
  code: number
  hours: { hour: string; temp: number; rain: number }[]
}

function weatherLabel(code: number): string {
  if (code === 0) return "Despejado"
  if (code <= 3) return "Parcialmente nublado"
  if (code <= 48) return "Niebla"
  if (code <= 55) return "Llovizna"
  if (code <= 65) return "Lluvia"
  if (code <= 82) return "Chubascos"
  if (code <= 99) return "Tormenta"
  return "Nublado"
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={className} />
  if (code <= 3) return <Cloud className={className} />
  if (code <= 65) return <CloudRain className={className} />
  if (code <= 82) return <CloudRain className={className} />
  return <CloudLightning className={className} />
}

function rainColor(prob: number) {
  if (prob >= 70) return "text-blue-600"
  if (prob >= 40) return "text-blue-400"
  return "text-gray-400"
}

export default function WeatherBanner() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); setError(true); return }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude: lat, longitude: lon } = coords
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,apparent_temperature,precipitation_probability,weathercode,wind_speed_10m` +
            `&hourly=temperature_2m,precipitation_probability` +
            `&forecast_days=1&timezone=auto`
          const res = await fetch(url)
          const data = await res.json()
          const c = data.current

          // Next 6 hours
          const now = new Date()
          const currentHour = now.getHours()
          const hours = data.hourly.time
            .map((t: string, i: number) => ({
              hour: new Date(t).getHours(),
              temp: Math.round(data.hourly.temperature_2m[i]),
              rain: data.hourly.precipitation_probability[i],
            }))
            .filter((h: { hour: number }) => h.hour >= currentHour && h.hour < currentHour + 6)
            .slice(0, 6)

          setWeather({
            temp: Math.round(c.temperature_2m),
            feelsLike: Math.round(c.apparent_temperature),
            rainProb: c.precipitation_probability,
            windSpeed: Math.round(c.wind_speed_10m),
            code: c.weathercode,
            hours,
          })
        } catch {
          setError(true)
        } finally {
          setLoading(false)
        }
      },
      () => { setLoading(false); setError(true) },
      { timeout: 8000 }
    )
  }, [])

  if (error || (!loading && !weather)) return null

  if (loading) return (
    <div className="mx-6 mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 flex items-center gap-2 text-xs text-blue-400 font-medium">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />Obteniendo clima de tu ubicación…
    </div>
  )

  if (!weather) return null

  return (
    <div className="mx-6 mt-4 rounded-2xl border border-blue-100 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)" }}>
      <div className="px-5 py-4 flex flex-wrap items-center gap-4">
        {/* Temperatura principal */}
        <div className="flex items-center gap-3">
          <WeatherIcon code={weather.code} className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <p className="text-2xl font-black text-blue-900 leading-none">
              {weather.temp}°C
            </p>
            <p className="text-xs text-blue-500 font-medium mt-0.5">{weatherLabel(weather.code)}</p>
          </div>
        </div>

        <div className="w-px h-10 bg-blue-200 hidden sm:block" />

        {/* Detalles */}
        <div className="flex flex-wrap gap-4 text-xs font-medium text-blue-700">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
            Sensación {weather.feelsLike}°C
          </span>
          <span className={`flex items-center gap-1 ${rainColor(weather.rainProb)}`}>
            <CloudRain className="w-3.5 h-3.5" />
            {weather.rainProb}% lluvia
          </span>
          <span className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-gray-400" />
            {weather.windSpeed} km/h viento
          </span>
        </div>

        {/* Próximas horas */}
        {weather.hours.length > 0 && (
          <>
            <div className="w-px h-10 bg-blue-200 hidden sm:block" />
            <div className="flex gap-3">
              {weather.hours.map((h) => (
                <div key={h.hour} className="text-center">
                  <p className="text-[10px] text-blue-400 font-bold">{h.hour}h</p>
                  <p className="text-xs font-black text-blue-800">{h.temp}°</p>
                  <p className={`text-[10px] font-bold ${rainColor(h.rain)}`}>
                    <Droplets className="w-2.5 h-2.5 inline" />{h.rain}%
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
