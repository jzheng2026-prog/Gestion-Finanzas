import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatEUR, formatEURConSigno, nombreMes } from '@/lib/format'

type Props = {
  netoMesActual: number
  netoMesAnterior: number
}

export function ResumenMensual({ netoMesActual, netoMesAnterior }: Props) {
  const diferencia = netoMesActual - netoMesAnterior
  const mejoró = diferencia >= 0
  const mes = nombreMes()
  const Icono = mejoró ? TrendingUp : TrendingDown

  return (
    <section
      aria-labelledby="resumen-mes"
      className="rounded-lg border border-border bg-card p-6"
    >
      <h2 id="resumen-mes" className="text-sm text-muted-foreground">
        Neto de {mes}
      </h2>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p
            className={`font-display text-4xl tabular-nums ${
              netoMesActual > 0
                ? 'text-primary'
                : netoMesActual < 0
                  ? 'text-destructive'
                  : 'text-foreground'
            }`}
          >
            {formatEURConSigno(netoMesActual)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            Mes anterior: {formatEURConSigno(netoMesAnterior)}
          </p>
        </div>
        {(netoMesActual !== 0 || netoMesAnterior !== 0) && (
          <p
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium tabular-nums ${
              mejoró
                ? 'bg-primary/10 text-primary'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            <Icono className="size-4" aria-hidden />
            <span className="sr-only">
              {mejoró ? 'Mejor que el mes anterior por' : 'Peor que el mes anterior por'}
            </span>
            {formatEUR(Math.abs(diferencia))}
          </p>
        )}
      </div>
    </section>
  )
}
