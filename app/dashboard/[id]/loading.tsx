function Bloque({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export default function ProyectoLoading() {
  return (
    <div
      className="mx-auto max-w-4xl px-5 pt-6 pb-16 sm:px-6 sm:pt-8"
      aria-busy="true"
      aria-label="Cargando"
    >
      <Bloque className="h-8 w-28" />

      <div className="flex flex-col gap-6 pt-8 pb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Bloque className="h-5 w-32" />
          <Bloque className="mt-3 h-12 w-56 sm:h-16 sm:w-72" />
          <Bloque className="mt-4 h-1.5 w-64" />
        </div>
        <div className="flex gap-2 sm:flex-col sm:items-end">
          <Bloque className="h-9 w-44" />
          <Bloque className="h-9 w-28" />
        </div>
      </div>

      <Bloque className="h-52 w-full rounded-lg" />

      <Bloque className="mt-16 h-7 w-32" />
      <div className="mt-6 space-y-5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-2">
              <Bloque className="h-4 w-20" />
              <Bloque className="h-3 w-32" />
            </div>
            <Bloque className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
