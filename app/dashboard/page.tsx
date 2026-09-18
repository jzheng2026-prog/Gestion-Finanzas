import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProyectoForm } from './proyecto-form'
import { ProyectoCard } from './proyecto-card'
import { MovimientoGeneralForm } from './movimiento-general-form'
import { TransferirForm } from './transferir-form'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: proyectos } = await supabase
    .from('balance_por_proyecto')
    .select('*')

  const { data: totalData } = await supabase
    .from('total_general')
    .select('total')
    .single()

  const { data: movimientosGenerales } = await supabase
    .from('movimientos')
    .select('*')
    .is('proyecto_id', null)
    .order('fecha', { ascending: false })

  const saldoGeneral = (movimientosGenerales ?? []).reduce(
    (acc, m) => acc + (m.tipo === 'ingreso' ? m.monto : -m.monto),
    0
  )

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 font-display text-lg text-muted-foreground">
            Total general
          </p>
          <p className="font-display text-6xl font-medium tabular-nums">
            {(totalData?.total ?? 0).toFixed(2)}
            <span className="text-3xl text-muted-foreground"> €</span>
          </p>
          <div className="mt-2 flex gap-4">
            <MovimientoGeneralForm />
            <TransferirForm
              proyectos={
                proyectos?.map((p) => ({
                  id: p.proyecto_id,
                  nombre: p.nombre,
                })) ?? []
              }
            />
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </div>

      <div className="mb-10 border border-border p-5">
        <p className="mb-3 text-sm text-muted-foreground">Desglose</p>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between py-2">
            <p className="text-sm">Saldo general</p>
            <p className="text-sm font-medium tabular-nums">
              {saldoGeneral.toFixed(2)} €
            </p>
          </div>
          {proyectos?.map((p) => (
            <div key={p.proyecto_id} className="flex items-center justify-between py-2">
              <p className="text-sm">{p.nombre}</p>
              <p className="text-sm font-medium tabular-nums">
                {p.balance.toFixed(2)} €
              </p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            <p className="text-sm font-medium">Total</p>
            <p className="font-display text-lg tabular-nums">
              {(totalData?.total ?? 0).toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-display text-xl">Tus proyectos</h2>
        <ProyectoForm />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {proyectos?.map((p) => (
          <ProyectoCard key={p.proyecto_id} proyecto={p} />
        ))}
        {proyectos?.length === 0 && (
          <p className="text-muted-foreground">
            Aún no tienes proyectos. Crea el primero para empezar a ahorrar.
          </p>
        )}
      </div>

      {movimientosGenerales && movimientosGenerales.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 border-b border-border pb-3 font-display text-xl">
            Movimientos generales
          </h2>
          <div className="divide-y divide-border">
            {movimientosGenerales.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">
                    {m.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'}
                  </p>
                  {m.nota && (
                    <p className="text-sm text-muted-foreground">{m.nota}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.fecha).toLocaleString('es-ES')}
                  </p>
                </div>
                <p
                  className={`font-display text-xl tabular-nums ${
                    m.tipo === 'ingreso' ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {m.tipo === 'ingreso' ? '+' : '−'}
                  {m.monto.toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}