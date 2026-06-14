export function SurqoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="40 18 600 548"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Surqo"
    >
      {/* ── ONDAS / CAMPO — 4 arcos cóncavos que forman el surco ── */}
      <path d="M 58,338 Q 208,720 362,302" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
      <path d="M 78,356 Q 208,680 342,320" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
      <path d="M 98,374 Q 208,640 322,338" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
      <path d="M 118,392 Q 208,600 302,356" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>

      {/* ── MONTAÑA con barras de estadística recortadas (evenodd) ── */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M 150,390 L 293,126 L 384,390 Z
           M 200,390 L 200,332 L 228,332 L 228,390 Z
           M 236,390 L 236,300 L 264,300 L 264,390 Z
           M 272,390 L 272,268 L 300,268 L 300,390 Z"
      />

      {/* ── V / PALOMITA ASCENDENTE — estadísticas en crecimiento ── */}
      <path
        d="M 384,390 L 434,454 L 537,108"
        fill="none"
        stroke="currentColor"
        strokeWidth="46"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />

      {/* ── GUIÓN HORIZONTAL derecho ── */}
      <rect x="486" y="326" width="98" height="42" rx="5" fill="currentColor"/>

      {/* ── TALLO ── */}
      <path d="M 537,108 L 537,72" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"/>

      {/* ── 5 HOJAS ── */}
      {/* Centro */}
      <path d="M 537,72 C 528,58 528,38 537,28 C 546,38 546,58 537,72 Z" fill="currentColor"/>
      {/* Izquierda media */}
      <path d="M 528,79 C 508,67 496,45 504,35 C 518,31 530,72 528,79 Z" fill="currentColor"/>
      {/* Derecha media */}
      <path d="M 546,79 C 566,67 578,45 570,35 C 556,31 544,72 546,79 Z" fill="currentColor"/>
      {/* Izquierda exterior */}
      <path d="M 518,86 C 494,77 480,56 490,45 C 502,38 520,80 518,86 Z" fill="currentColor"/>
      {/* Derecha exterior */}
      <path d="M 556,86 C 580,77 594,56 584,45 C 572,38 554,80 556,86 Z" fill="currentColor"/>
    </svg>
  )
}
