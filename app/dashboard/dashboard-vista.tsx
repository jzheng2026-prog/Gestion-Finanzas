import Link from 'next/link'
import { Search, UserRound } from 'lucide-react'
import { formatEUR, formatImporte } from '@/lib/format'
import { esCompartido, miParte, type Movimiento, type Proyecto } from '@/lib/tipos'
import { ProyectoForm } from './proyecto-form'
import { ProyectosLista } from './proyectos-lista'
import { ProyectosArchivados } from './proyectos-archivados'
import { MovimientoGeneralForm } from './movimiento-general-form'
import { TransferirForm } from './transferir-form'
import { RepartirForm } from './repartir-form'
import { SignOutButton } from './signout-button'
import { ResumenMensual } from './resumen-mensual'
import { GastosCategoria, type GastoCategoria } from './gastos-categoria'
import { Historial } from './[id]/historial'
import { BalanceChart } from './[id]/balance-chart'
import { signOut } from './actions'

// Acciones que abren un diálogo al entrar (accesos directos de la PWA)
export type Accion = 'movimiento' | 'transferir' | 'repartir'

export type DashboardDatos = {
  userEmail: string | null
  total: number
  saldoGeneral: number
  netoMesActual: number
  netoMesAnterior: number
  activos: Proyecto[]
  archivados: Proyecto[]
  gastos: GastoCategoria[]
  mesActual: string
  mesAnterior: string
  /** Primera página de los movimientos del saldo general */
  movimientosGenerales: Movimiento[]
  totalGenerales: number
  /** Todos los movimientos (fecha, tipo, monto) para la gráfica del total */
  serieTotal: Pick<Movimiento, 'fecha' | 'tipo' | 'monto'>[]
  accion?: Accion
}

/** Presentación del dashboard, separada de la carga de datos (ver page.tsx) */
export function DashboardVista({
  userEmail,
  total,
  saldoGeneral,
  netoMesActual,
  netoMesAnterior,
  activos,
  archivados,
  gastos,
  mesActual,
  mesAnterior,
  movimientosGenerales,
  totalGenerales,
  serieTotal,
  accion,
}: DashboardDatos) {
  const balanceArchivados = archivados.reduce((acc, p) => acc + miParte(p), 0)
  const saldos: Record<string, number> = {
    general: saldoGeneral,
    ...Object.fromEntries(activos.map((p) => [p.proyecto_id, p.balance])),
  }
  const opcionesTransferencia = activos.map((p) => ({
    id: p.proyecto_id,
    nombre: p.nombre,
    balance: p.balance,
    monto_objetivo: p.monto_objetivo,
  }))

  return (
    <div className="mx-auto max-w-4xl px-5 pt-6 pb-16 sm:px-6 sm:pt-8">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <p className="font-display text-lg">Finanzas</p>
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href="/dashboard/buscar"
            className="icon-action"
            aria-label="Buscar movimientos"
            title="Buscar movimientos"
          >
            <Search className="size-4" />
          </Link>
          <Link
            href="/dashboard/cuenta"
            className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <UserRound className="size-4 shrink-0" aria-hidden />
            <span className="hidden truncate sm:inline">{userEmail}</span>
            <span className="sm:hidden">Cuenta</span>
          </Link>
          <form action={signOut}>
            <SignOutButton />
          </form>
        </div>
      </header>

      <main className="animate-fade-in-up">
        <section aria-labelledby="total-general" className="pt-10 pb-12 sm:pt-14">
          <h1 id="total-general" className="font-display text-lg text-muted-foreground">
            Total general
          </h1>
          <p className="mt-1 font-display text-5xl font-medium tracking-tight tabular-nums sm:text-7xl">
            {formatImporte(total)}
            <span className="text-2xl text-muted-foreground sm:text-4xl"> €</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <MovimientoGeneralForm
              abrirAlInicio={accion === 'movimiento'}
              saldoGeneral={saldoGeneral}
            />
            <RepartirForm
              saldoGeneral={saldoGeneral}
              proyectos={activos}
              abrirAlInicio={accion === 'repartir'}
            />
            <TransferirForm
              proyectos={opcionesTransferencia}
              saldos={saldos}
              abrirAlInicio={accion === 'transferir'}
            />
          </div>
        </section>

        {serieTotal.length > 1 && (
          <section aria-labelledby="evolucion-total" className="mb-12">
            <h2 id="evolucion-total" className="mb-4 text-sm text-muted-foreground">
              Evolución del total
            </h2>
            <BalanceChart movimientos={serieTotal} etiqueta="Total" />
          </section>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
          <ResumenMensual
            netoMesActual={netoMesActual}
            netoMesAnterior={netoMesAnterior}
          />

          <section
            aria-labelledby="desglose"
            className="rounded-lg md:col-start-2 md:row-span-2 border border-border bg-card p-6"
          >
            <h2 id="desglose" className="text-sm text-muted-foreground">
              Desglose
            </h2>
            <dl className="mt-2 divide-y divide-border">
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-sm">Saldo general</dt>
                <dd className="shrink-0 text-sm font-medium whitespace-nowrap tabular-nums">
                  {formatEUR(saldoGeneral)}
                </dd>
              </div>
              {activos.map((p) => (
                <div
                  key={p.proyecto_id}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                >
                  <dt className="flex min-w-0 items-center gap-1.5 text-sm">
                    <span className="truncate">{p.nombre}</span>
                    {esCompartido(p) && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        (tu parte)
                      </span>
                    )}
                  </dt>
                  <dd
                    className={`shrink-0 text-sm font-medium whitespace-nowrap tabular-nums ${
                      miParte(p) < 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {formatEUR(miParte(p))}
                  </dd>
                </div>
              ))}
              {archivados.length > 0 && (
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-sm text-muted-foreground">
                    Archivados ({archivados.length})
                  </dt>
                  <dd className="shrink-0 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatEUR(balanceArchivados)}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 pt-3">
                <dt className="text-sm font-medium">Total</dt>
                <dd className="shrink-0 font-display text-lg whitespace-nowrap tabular-nums">
                  {formatEUR(total)}
                </dd>
              </div>
            </dl>
          </section>

          <div className="md:col-start-1">
            <GastosCategoria
              gastos={gastos}
              mesActual={mesActual}
              mesAnterior={mesAnterior}
            />
          </div>
        </div>

        <section aria-labelledby="tus-proyectos" className="mt-16">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-4">
            <h2 id="tus-proyectos" className="font-display text-2xl">
              Tus proyectos
            </h2>
            <ProyectoForm />
          </div>

          <ProyectosLista proyectos={activos} hayArchivados={archivados.length > 0} />
          <ProyectosArchivados proyectos={archivados} />
        </section>

        {totalGenerales > 0 && (
          <section aria-labelledby="movimientos-generales" className="mt-16">
            <h2
              id="movimientos-generales"
              className="mb-4 border-b border-border pb-4 font-display text-2xl"
            >
              Movimientos generales
            </h2>
            <Historial
              proyectoId={null}
              movimientos={movimientosGenerales}
              total={totalGenerales}
              nombreProyecto="saldo-general"
            />
          </section>
        )}
      </main>
    </div>
  )
}
