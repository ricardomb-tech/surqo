// Placeholders "esqueleto" que mantienen el layout mientras carga la data.
// Se sienten mucho más fluidos que un spinner de pantalla completa.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

export function PageSkeleton({ variant = "cards" }: { variant?: "cards" | "dashboard" }) {
  return (
    <div className="min-h-screen pb-16">
      <header className="h-16 flex items-center px-6 border-b sticky top-0 z-30"
        style={{ background: "#ffffff", borderColor: "#e8f0e8" }}>
        <Skeleton className="h-4 w-44" />
      </header>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <Skeleton className="h-7 w-56" />
        {variant === "dashboard" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )
}
