'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Hero.module.css'

const METRICS = [
  '🌡 Temp. suelo: 24.3°C',
  '💧 Humedad: 67%',
  '🌱 N-P-K: Óptimo',
  '🌬 VPD: 1.2 kPa',
  '☀️ Rad. solar: 842 W/m²',
]

const INTERVAL_MS = 2500
const FADE_MS = 400

export function SensorTicker() {
  const [index, setIndex]     = useState(0)
  const [visible, setVisible] = useState(true)
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % METRICS.length)
        setVisible(true)
      }, FADE_MS)
    }, INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div className={styles.ticker} role="status" aria-live="polite" aria-atomic="true">
      <div className={styles.tickerHeader}>
        <span className={styles.tickerDot} aria-hidden="true" />
        DATOS EN VIVO · SENSOR #042
      </div>
      <div className={`${styles.tickerValue} ${visible ? styles.visible : styles.hidden}`}>
        {METRICS[index]}
      </div>
    </div>
  )
}
