export function SurqoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 445"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Surqo"
    >
      {/* ── ONDAS / SURCOS — 4 arcos curvos en forma de cuenco ── */}
      <path d="M 10,278 Q 138,382 278,260" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
      <path d="M 28,296 Q 138,366 256,278" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
      <path d="M 46,314 Q 138,350 234,296" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
      <path d="M 64,332 Q 138,334 212,314" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>

      {/* ── MONTAÑA con barras de estadística recortadas (fill-rule evenodd) ── */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M 98,340 L 190,122 L 284,333 Z
           M 148,276 L 170,276 L 170,340 L 148,340 Z
           M 176,247 L 198,247 L 198,340 L 176,340 Z
           M 204,218 L 226,218 L 226,340 L 204,340 Z"
      />

      {/* ── V / PALOMITA ASCENDENTE (estadísticas) ── */}
      <path
        d="M 284,333 L 362,418 L 470,75"
        fill="none"
        stroke="currentColor"
        strokeWidth="44"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />

      {/* ── GUIÓN HORIZONTAL derecho ── */}
      <rect x="444" y="252" width="66" height="40" rx="5" fill="currentColor"/>

      {/* ── TALLO ── */}
      <path d="M 470,75 L 470,54" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round"/>

      {/* ── 5 HOJAS ── */}
      {/* Hoja central (apunta arriba) */}
      <path d="M 470,56 C 461,44 461,28 470,20 C 479,28 479,44 470,56 Z" fill="currentColor"/>
      {/* Hoja izquierda media */}
      <path d="M 463,62 C 447,51 436,33 444,25 C 456,22 465,55 463,62 Z" fill="currentColor"/>
      {/* Hoja derecha media */}
      <path d="M 477,62 C 493,51 504,33 496,25 C 484,22 475,55 477,62 Z" fill="currentColor"/>
      {/* Hoja izquierda exterior */}
      <path d="M 457,68 C 437,60 424,42 433,33 C 443,28 458,61 457,68 Z" fill="currentColor"/>
      {/* Hoja derecha exterior */}
      <path d="M 483,68 C 503,60 516,42 507,33 C 497,28 482,61 483,68 Z" fill="currentColor"/>
    </svg>
  )
}
