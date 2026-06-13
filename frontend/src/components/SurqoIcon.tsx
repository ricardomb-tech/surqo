export function SurqoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 68 84"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Surqo"
    >
      {/* ── Escalón 1 — inferior izquierdo ── */}
      <rect x="2"  y="72" width="26" height="10" rx="2.5" />

      {/* ── Conector 1 → 2 ── */}
      <rect x="18" y="62" width="10" height="12" />

      {/* ── Escalón 2 — centro ── */}
      <rect x="18" y="52" width="26" height="10" rx="2.5" />

      {/* ── Conector 2 → 3 ── */}
      <rect x="34" y="42" width="10" height="12" />

      {/* ── Escalón 3 — superior derecho ── */}
      <rect x="34" y="32" width="26" height="10" rx="2.5" />

      {/* ── Tallo de la planta ── */}
      <rect x="44" y="10" width="6" height="24" rx="3" />

      {/* ── Hoja central (apunta hacia arriba) ── */}
      <path d="M47,11 C41,6 41,0 47,0 C53,0 53,6 47,11Z" />

      {/* ── Hoja izquierda ── */}
      <path d="M45,18 C32,10 29,2 36,3 C43,4 45,13 45,18Z" />

      {/* ── Hoja derecha ── */}
      <path d="M49,18 C62,10 65,2 58,3 C51,4 49,13 49,18Z" />
    </svg>
  )
}
