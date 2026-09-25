import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatEUR, formatImporte } from '@/lib/format'
import { formatMesAnio, planAhorro } from '@/lib/objetivo'
import type { Movimiento } from '@/lib/tipos'
import { MovimientoForm } from './movimiento-form'
import { TransferirForm } from '../transferir-form'
import { Historial } from './historial'
import { BalanceChart } from './balance-chart'
import { BannerArchivado } from './banner-archivado'
import { LineaRitmo } from '../linea-ritmo'

export type ProyectoDatos = {
  id: string
  proyecto: {
    nombre: string
    monto_objetivo: number | null
    fecha_objetivo?: string | null
    archivado_en?: string | null
    created_at?: string | null
  }
  balance: number
  /** Primera página del historial */
  movimientos: Movimiento[]
  totalMovimientos: number
  /** Todos los movimientos (solo fecha, tipo y monto) para la gráfica */
  serie: Pick<Movimiento, 'fecha' | 'tipo' | 'monto'>[]
  opcionesTransferencia: {
    id: string
    nombre: string
    balance?: number
    monto_objetivo?: number | null
  }[]
}

/** Presentación de un proyecto, separada de la carga de datos (ver page.tsx) */
export function ProyectoVista({
  id,
  proyecto,
  balance,
  movimientos,
  totalMovimientos,
  serie,
  opcionesTransferencia,
}: ProyectoDatos) {
  const objetivo: number | null = proyecto.monto_objetivo
  const progreso = objetivo
    ? Math.max(Math.min((balance / objetivo) * 100, 100), 0)
    : null
  const plan = planAhorro(balance, objetivo, proyecto.fecha_objetivo)

  return (
    <div className="mx-auto max-w-4xl px-5 pt-6 pb-16 sm:px-6 sm:pt-8">
      <Link
        href="/dashboard"
        className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>

      <main className="animate-fade-in-up">
        <section className="flex flex-col gap-6 pt-8 pb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg text-muted-foreground">
              {proyecto.nombre}
            </h1>
            <p className="mt-1 font-display text-5xl font-medium tracking-tight tabular-nums sm:text-7xl">
              {formatImporte(balance)}
              <span className="text-2xl text-muted-foreground sm:text-4xl"> €</span>
            </p>
            {objetivo !== null && progreso !== null && (
              <div className="mt-4 max-w-sm">
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progreso)}
                  aria-label="Progreso hacia el objetivo"
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-700 ease-(--ease-out-expo)"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground tabular-nums">
                  {progreso.toFixed(0)} % de {formatEUR(objetivo)}
                </p>
                {plan && (
                  <p
                    className={`mt-1 text-sm tabular-nums ${
                      plan.vencido ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {plan.vencido ? (
                      <>Fecha superada · faltan {formatEUR(plan.restante)}</>
                    ) : (
                      <>
                        Aparta{' '}
                        <span className="font-medium">{formatEUR(plan.porMes)}/mes</span>{' '}
                        durante {plan.meses} {plan.meses === 1 ? 'mes' : 'meses'} para
                        llegar en {formatMesAnio(proyecto.fecha_objetivo!)}
                      </>
                    )}
                  </p>
                )}
                <LineaRitmo
                  balance={balance}
                  objetivo={objetivo}
                  fechaObjetivo={proyecto.fecha_objetivo}
                  creadoEn={proyecto.created_at}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <MovimientoForm
              proyectoId={id}
              nombreProyecto={proyecto.nombre}
              balance={balance}
              objetivo={objetivo}
            />
            <TransferirForm
              proyectos={opcionesTransferencia}
              defaultOrigen={id}
              saldos={Object.fromEntries(
                opcionesTransferencia.map((o) => [o.id, o.balance ?? 0])
              )}
            />
          </div>
        </section>

        {proyecto.archivado_en && (
          <div className="-mt-6 mb-12">
            <BannerArchivado id={id} nombre={proyecto.nombre} />
          </div>
        )}

        {serie.length > 0 && (
          <section aria-labelledby="evolucion" className="mb-16">
            <h2 id="evolucion" className="mb-4 text-sm text-muted-foreground">
              Evolución del balance
            </h2>
            <BalanceChart movimientos={serie} />
          </section>
        )}

        <section aria-labelledby="historial">
          <h2
            id="historial"
            className="mb-4 border-b border-border pb-4 font-display text-2xl"
          >
            Historial
          </h2>

          <Historial
            proyectoId={id}
            movimientos={movimientos}
            total={totalMovimientos}
            nombreProyecto={proyecto.nombre}
          />
        </section>
      </main>
    </div>
  )
}
