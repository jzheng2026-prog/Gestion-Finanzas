import { cache } from 'react'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { consultaHistorial, FILTROS_VACIOS } from '@/lib/historial'
import { todasLasFilas } from '@/lib/todas-las-filas'
import type { Movimiento } from '@/lib/tipos'
import { ProyectoVista } from './proyecto-vista'

// Compartida por generateMetadata y la página: una sola consulta por petición
const getProyecto = cache(async (id: string) => {
  const supabase = await createClient()
  return supabase.from('proyectos').select('*').eq('id', id).single()
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { data } = await getProyecto(id)
  return { title: data?.nombre ?? 'Proyecto' }
}

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const headersList = await headers()
  const userId = headersList.get('x-user-id')

  if (!userId) {
    redirect('/login')
  }

  const supabase = await createClient()

  const [
    { data: proyecto },
    { data: balances, error: errorBalances },
    { data: primeraPagina, count, error: errorHistorial },
    { data: serie, error: errorSerie },
    { data: todosLosProyectos, error: errorProyectos },
  ] = await Promise.all([
    getProyecto(id),
    supabase.from('balance_por_proyecto').select('proyecto_id, balance'),
    consultaHistorial(supabase, id, FILTROS_VACIOS),
    // Para la gráfica: todos los movimientos, pero solo lo imprescindible
    todasLasFilas<{ fecha: string; tipo: 'ingreso' | 'retiro'; monto: number }>(
      (desde, hasta) =>
        supabase
          .from('movimientos')
          .select('fecha, tipo, monto')
          .eq('proyecto_id', id)
          .order('fecha', { ascending: false })
          .order('id')
          .range(desde, hasta)
    ),
    // '*' y no columnas concretas: archivado_en puede no existir aún
    supabase.from('proyectos').select('*'),
  ])

  if (!proyecto) {
    notFound()
  }

  const error = errorHistorial ?? errorSerie ?? errorProyectos ?? errorBalances
  if (error) {
    throw new Error(error.message)
  }

  const saldoDe = new Map(
    (balances ?? []).map((b) => [b.proyecto_id as string, b.balance as number])
  )

  return (
    <ProyectoVista
      id={id}
      proyecto={proyecto}
      balance={saldoDe.get(id) ?? 0}
      movimientos={(primeraPagina ?? []) as Movimiento[]}
      totalMovimientos={count ?? 0}
      serie={serie ?? []}
      opcionesTransferencia={(todosLosProyectos ?? [])
        // Destinos: proyectos activos (y este, aunque esté archivado)
        .filter((p) => !p.archivado_en || p.id === id)
        .map((p) => ({
          id: p.id as string,
          nombre: p.nombre as string,
          balance: saldoDe.get(p.id) ?? 0,
          monto_objetivo: p.monto_objetivo as number | null,
        }))}
    />
  )
}
