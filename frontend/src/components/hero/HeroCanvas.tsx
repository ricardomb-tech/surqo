'use client'

import { useEffect, useRef } from 'react'
import styles from './Hero.module.css'

/* ── Types ── */
interface Node {
  x: number
  y: number
  phase: number
  speed: number
}

interface Particle {
  fromIdx: number
  toIdx:   number
  t:       number
  speed:   number
}

/* ── Constants ── */
const NODE_COUNT        = 10
const CONNECTION_DIST   = 200
const NODE_RADIUS_MIN   = 4
const NODE_RADIUS_MAX   = 8
const PARTICLE_SPEED_MIN = 0.003
const PARTICLE_SPEED_MAX = 0.006
const NODE_COLOR        = '#40916C'
const NODE_GLOW         = '#74C69D'
const PARTICLE_COLOR    = '#74C69D'
const LINE_COLOR_BASE   = [64, 145, 108] as const

/* ── Data card positions (% of canvas) ── */
const DATA_CARDS = [
  { label: 'TEMP', value: '24.3°C', left: '62%', top: '28%' },
  { label: 'HUM',  value: '67% RH', left: '72%', top: '55%' },
  { label: 'pH',   value: '6.2',    left: '52%', top: '68%' },
]

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /* ── Reduced motion: static only ── */
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* ── Resize handler ── */
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      canvas.width  = rect.width
      canvas.height = rect.height
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    /* ── Init nodes (pre-allocated, no rAF allocs) ── */
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x:     0.1 + Math.random() * 0.8,
      y:     0.1 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
    }))

    /* ── Init particles on eligible connections ── */
    const particles: Particle[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = (nodes[i].x - nodes[j].x) * canvas.width
        const dy = (nodes[i].y - nodes[j].y) * canvas.height
        if (Math.sqrt(dx * dx + dy * dy) < CONNECTION_DIST) {
          particles.push({
            fromIdx: i,
            toIdx:   j,
            t:       Math.random(),
            speed:   PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN),
          })
        }
      }
    }

    /* ── Draw static background once ── */
    const drawStatic = () => {
      ctx.fillStyle = '#060E1A'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    /* ── Main rAF loop ── */
    let startTime = performance.now()

    const draw = (now: number) => {
      if (document.visibilityState === 'hidden') {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      const t = (now - startTime) * 0.001
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)
      drawStatic()

      /* connection lines */
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const ax = nodes[i].x * w
          const ay = nodes[i].y * h
          const bx = nodes[j].x * w
          const by = nodes[j].y * h
          const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.35
            ctx.beginPath()
            ctx.strokeStyle = `rgba(${LINE_COLOR_BASE[0]},${LINE_COLOR_BASE[1]},${LINE_COLOR_BASE[2]},${alpha})`
            ctx.lineWidth = 0.5
            ctx.moveTo(ax, ay)
            ctx.lineTo(bx, by)
            ctx.stroke()
          }
        }
      }

      /* traveling particles */
      for (const p of particles) {
        p.t = (p.t + p.speed) % 1
        const ax = nodes[p.fromIdx].x * w
        const ay = nodes[p.fromIdx].y * h
        const bx = nodes[p.toIdx].x * w
        const by = nodes[p.toIdx].y * h
        const px = ax + (bx - ax) * p.t
        const py = ay + (by - ay) * p.t

        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = PARTICLE_COLOR
        ctx.shadowBlur = 8
        ctx.shadowColor = NODE_GLOW
        ctx.fill()
        ctx.shadowBlur = 0
      }

      /* nodes */
      for (const node of nodes) {
        const phase  = node.phase + t * node.speed
        const radius = NODE_RADIUS_MIN + (NODE_RADIUS_MAX - NODE_RADIUS_MIN) * (0.5 + 0.5 * Math.sin(phase))
        const alpha  = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(phase))
        const nx     = node.x * w
        const ny     = node.y * h

        ctx.beginPath()
        ctx.arc(nx, ny, radius, 0, Math.PI * 2)
        ctx.fillStyle = NODE_COLOR
        ctx.globalAlpha = alpha
        ctx.shadowBlur = 15
        ctx.shadowColor = NODE_GLOW
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      /* corner label */
      ctx.font = '10px monospace'
      ctx.fillStyle = 'rgba(116,198,157,0.5)'
      ctx.fillText('RED SURQO · 12 SENSORES ACTIVOS', 16, h - 16)

      rafRef.current = requestAnimationFrame(draw)
    }

    if (prefersReduced) {
      drawStatic()
    } else {
      rafRef.current = requestAnimationFrame(draw)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !prefersReduced) {
        startTime = performance.now() - startTime
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Red de sensores IoT Surqo — visualización en tiempo real"
        role="img"
      />
      {DATA_CARDS.map((card) => (
        <div
          key={card.label}
          className={`${styles.dataCard} ${styles.dataCardFloating}`}
          style={{ left: card.left, top: card.top }}
          aria-hidden="true"
        >
          <div className={styles.dataCardLabel}>{card.label}</div>
          {card.value}
        </div>
      ))}
    </div>
  )
}
