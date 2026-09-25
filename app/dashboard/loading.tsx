function Bloque({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div
      className="mx-auto max-w-4xl px-5 pt-6 pb-16 sm:px-6 sm:pt-8"
      aria-busy="true"
      aria-label="Cargando"
    >
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Bloque className="h-6 w-24" />
        <Bloque className="h-8 w-40" />
      </div>

      <div className="pt-10 pb-12 sm:pt-14">
        <Bloque className="h-5 w-28" />
        <Bloque className="mt-3 h-12 w-64 sm:h-16 sm:w-80" />
        <div className="mt-6 flex gap-2">
          <Bloque className="h-9 w-48" />
          <Bloque className="h-9 w-28" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Bloque className="h-36 rounded-lg" />
        <Bloque className="h-36 rounded-lg" />
      </div>

      <div className="mt-16 flex items-center justify-between border-b border-border pb-4">
        <Bloque className="h-7 w-40" />
        <Bloque className="h-9 w-36" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Bloque className="h-32 rounded-lg" />
        <Bloque className="h-32 rounded-lg" />
      </div>
    </div>
  )
}
