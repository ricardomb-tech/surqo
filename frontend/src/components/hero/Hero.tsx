import Link from 'next/link'
import { SensorTicker } from './SensorTicker'
import { HeroCanvas } from './HeroCanvas'
import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero} aria-label="Surqo — Plataforma agrícola IoT">

      {/* ── Left copy ── */}
      <div className={styles.copy}>

        {/* [A] Badge */}
        <div className={styles.badge} aria-label="Estado: en vivo">
          <span className={styles.badgeDot} aria-hidden="true" />
          Plataforma AgriTech · IoT en tiempo real
        </div>

        {/* [B] Headline */}
        <h1 className={styles.headline}>
          <span className={styles.word}>Agricultura</span>{' '}
          <span className={styles.word}>guiada</span>{' '}
          <span className={styles.word}>por</span>{' '}
          <br />
          <span className={styles.headlineAccent}>datos reales</span>
        </h1>

        {/* [C] Subheadline */}
        <p className={styles.sub}>
          Surqo conecta tus sensores de campo con IA para darte
          alertas precisas, análisis predictivo y decisiones
          más rentables — desde cualquier dispositivo.
        </p>

        {/* [D] Sensor Ticker */}
        <div className={styles.tickerWrap}>
          <SensorTicker />
        </div>

        {/* [E] CTAs */}
        <div className={styles.ctas}>
          <Link href="/register" className={styles.ctaPrimary}>
            Empezar gratis
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link href="/como-funciona" className={styles.ctaSecondary}>
            Ver demo
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/>
            </svg>
          </Link>
        </div>

        {/* [F] Trust line */}
        <p className={styles.trust}>
          Sin tarjeta de crédito · 100% gratis · Datos seguros
        </p>
      </div>

      {/* ── Right canvas ── */}
      <div className={styles.canvasWrap} aria-hidden="true">
        <HeroCanvas />
      </div>

      {/* Scroll cue */}
      <div className={styles.scrollCue} aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

    </section>
  )
}
