import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { MovimientoForm } from './movimiento-form'
import { TransferirForm } from '../transferir-form'
import { Historial } from './historial'
import { BalanceChart } from './balance-chart'

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('*')
    .eq('id', id)
    .single()

  if (!proyecto) {
    notFound()
  }

  const { data: balanceData } = await supabase
    .from('balance_por_proyecto')
    .select('balance')
    .eq('proyecto_id', id)
    .single()

  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('*')
    .eq('proyecto_id', id)
    .order('fecha', { ascending: false })

  const { data: todosLosProyectos } = await supabase
    .from('proyectos')
    .select('id, nombre')

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Dashboard
      </Link>

      <div className="mt-4 mb-10 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{proyecto.nombre}</p>
          <p className="font-display text-6xl font-medium tabular-nums">
            {(balanceData?.balance ?? 0).toFixed(2)}
            <span className="text-3xl text-muted-foreground"> €</span>
          </p>
          {proyecto.monto_objetivo && (
            <p className="mt-1 text-sm text-muted-foreground">
              Objetivo: {proyecto.monto_objetivo.toFixed(2)} €
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
            <MovimientoForm proyectoId={id} />
            <TransferirForm
                proyectos={todosLosProyectos ?? []}
                defaultOrigen={id}
            />
        </div>
      </div>

      <div className="mb-10">
        <BalanceChart movimientos={movimientos ?? []} />
      </div>

      <h2 className="mb-4 border-b border-border pb-3 font-display text-xl">
        Historial
      </h2>

      <Historial movimientos={movimientos ?? []} nombreProyecto={proyecto.nombre} />
    </div>
  )
}