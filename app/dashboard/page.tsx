import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { inicioDeMes, nombreMes } from '@/lib/format'
import { consultaHistorial, FILTROS_VACIOS } from '@/lib/historial'
import { todasLasFilas } from '@/lib/todas-las-filas'
import type { Movimiento, Proyecto } from '@/lib/tipos'
import type { GastoCategoria } from './gastos-categoria'
import { DashboardVista, type Accion } from './dashboard-vista'

export const metadata = { title: 'Inicio' }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ accion?: string }>
}) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email')

  if (!userId) {
    redirect('/login')
  }

  const { accion } = (await searchParams) as { accion?: Accion }
  const supabase = await createClient()

  const inicioMesActual = inicioDeMes(0)
  const inicioMesAnterior = inicioDeMes(1)

  const resultados = await Promise.all([
    supabase.from('balance_por_proyecto').select('*'),
    // '*' y no columnas concretas: fecha_objetivo y archivado_en pueden no
    // existir todavía si falta la migración
    supabase.from('proyectos').select('*'),
    supabase.from('total_general').select('total').single(),
    consultaHistorial(supabase, null, FILTROS_VACIOS),
    // Por bloques: Supabase no devuelve más de 1.000 filas por petición
    todasLasFilas<{ tipo: 'ingreso' | 'retiro'; monto: number; fecha: string; categoria: string | null }>(
      (desde, hasta) =>
        supabase
          .from('movimientos')
          .select('tipo, monto, fecha, categoria')
          .eq('usuario_id', userId)
          .gte('fecha', inicioMesAnterior.toISOString())
          .order('id')
          .range(desde, hasta)
    ),
    // Evolución del total: todos los movimientos, solo lo imprescindible
    todasLasFilas<{ tipo: 'ingreso' | 'retiro'; monto: number; fecha: string }>(
      (desde, hasta) =>
        supabase
          .from('movimientos')
          .select('fecha, tipo, monto')
          .order('fecha', { ascending: false })
          .order('id')
          .range(desde, hasta)
    ),
  ])

  // Mejor mostrar un error que un "0,00 €" que parezca real
  const fallo = resultados.find((r) => r.error)
  if (fallo?.error) {
    throw new Error(fallo.error.message)
  }

  const [
    { data: balances },
    { data: filasProyectos },
    { data: totalData },
    { data: primeraPaginaGenerales, count: totalGenerales },
    { data: movimientosDelPeriodo },
    { data: serieTotal },
  ] = resultados

  // Vista de balances + columnas extra de la tabla
  const extras = new Map(
    (filasProyectos ?? []).map((p) => [p.id as string, p])
  )
  const proyectos: Proyecto[] = (balances ?? []).map((b) => {
    const extra = extras.get(b.proyecto_id)
    return {
      ...b,
      ...(extra && 'fecha_objetivo' in extra
        ? { fecha_objetivo: extra.fecha_objetivo }
        : {}),
      ...(extra && 'archivado_en' in extra
        ? { archivado_en: extra.archivado_en }
        : {}),
      ...(extra && 'created_at' in extra ? { creado_en: extra.created_at } : {}),
    }
  })
  const activos = proyectos.filter((p) => !p.archivado_en)
  const archivados = proyectos.filter((p) => p.archivado_en)

  // Lo que no está en ningún proyecto (incluidos los archivados) es saldo general
  const total = totalData?.total ?? 0
  const saldoGeneral =
    total - proyectos.reduce((acc, p) => acc + p.balance, 0)

  let netoMesActual = 0
  let netoMesAnterior = 0
  const gastosPorCategoria = new Map<string, GastoCategoria>()
  for (const m of movimientosDelPeriodo ?? []) {
    const esMesActual = new Date(m.fecha) >= inicioMesActual
    const signo = m.tipo === 'ingreso' ? 1 : -1
    if (esMesActual) {
      netoMesActual += signo * m.monto
    } else {
      netoMesAnterior += signo * m.monto
    }

    // Las transferencias y repartos no llevan categoría: no cuentan como gasto
    if (m.tipo === 'retiro' && m.categoria) {
      const g = gastosPorCategoria.get(m.categoria) ?? {
        categoria: m.categoria,
        actual: 0,
        anterior: 0,
      }
      if (esMesActual) g.actual += m.monto
      else g.anterior += m.monto
      gastosPorCategoria.set(m.categoria, g)
    }
  }
  const gastos = [...gastosPorCategoria.values()].sort(
    (a, b) => b.actual - a.actual || b.anterior - a.anterior
  )

  return (
    <DashboardVista
      userEmail={userEmail}
      total={total}
      saldoGeneral={saldoGeneral}
      netoMesActual={netoMesActual}
      netoMesAnterior={netoMesAnterior}
      activos={activos}
      archivados={archivados}
      gastos={gastos}
      mesActual={nombreMes(inicioMesActual)}
      mesAnterior={nombreMes(inicioMesAnterior)}
      movimientosGenerales={(primeraPaginaGenerales ?? []) as Movimiento[]}
      totalGenerales={totalGenerales ?? 0}
      serieTotal={serieTotal ?? []}
      accion={accion}
    />
  )
}
