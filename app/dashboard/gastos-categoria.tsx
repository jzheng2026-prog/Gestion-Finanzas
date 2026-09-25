import { formatEUR } from '@/lib/format'

export type GastoCategoria = {
  categoria: string
  actual: number
  anterior: number
}

export function GastosCategoria({
  gastos,
  mesActual,
  mesAnterior,
}: {
  gastos: GastoCategoria[]
  mesActual: string
  mesAnterior: string
}) {
  const maximo = Math.max(...gastos.flatMap((g) => [g.actual, g.anterior]), 0)
  const totalActual = gastos.reduce((acc, g) => acc + g.actual, 0)
  const hayAnterior = gastos.some((g) => g.anterior > 0)

  return (
    <section
      aria-labelledby="gastos-categoria"
      className="rounded-lg border border-border bg-card p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="gastos-categoria" className="text-sm text-muted-foreground">
          En qué se va el dinero en {mesActual}
        </h2>
        {gastos.length > 0 && hayAnterior && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground" aria-hidden>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-[2px] bg-primary" />
              <span className="capitalize">{mesActual}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-0.5 rounded-full bg-foreground/60" />
              <span className="capitalize">{mesAnterior}</span>
            </span>
          </div>
        )}
      </div>

      {gastos.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Cuando registres retiros con categoría, verás aquí en qué se va el
          dinero cada mes.
        </p>
      ) : (
        <>
          <ul className="mt-5 space-y-3.5">
            {gastos.map((g) => {
              const diferencia = g.actual - g.anterior
              const detalle = `${g.categoria}: ${formatEUR(g.actual)} en ${mesActual}, ${formatEUR(g.anterior)} en ${mesAnterior}`
              return (
                <li key={g.categoria} title={detalle}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span>{g.categoria}</span>
                    <span className="tabular-nums">
                      <span className="font-medium">{formatEUR(g.actual)}</span>
                      {g.anterior > 0 && Math.abs(diferencia) >= 0.005 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {diferencia > 0 ? '+' : '−'}
                          {formatEUR(Math.abs(diferencia))}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-2" aria-hidden>
                    <div className="absolute inset-0 rounded-full bg-muted" />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700 ease-(--ease-out-expo)"
                      style={{ width: `${maximo ? (g.actual / maximo) * 100 : 0}%` }}
                    />
                    {g.anterior > 0 && (
                      <div
                        className="absolute -inset-y-0.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground/60 ring-2 ring-card"
                        style={{ left: `${(g.anterior / maximo) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="sr-only">{detalle}</span>
                </li>
              )
            })}
          </ul>
          <p className="mt-5 flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Total con categoría</span>
            <span className="font-medium tabular-nums">{formatEUR(totalActual)}</span>
          </p>
        </>
      )}
    </section>
  )
}
