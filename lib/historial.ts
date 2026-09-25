import type { SupabaseClient } from '@supabase/supabase-js'
import type { Movimiento } from './tipos'
import { todasLasFilas } from './todas-las-filas'

export const TAM_PAGINA = 50

/** Ámbito del historial: id de un proyecto, null (saldo general) o TODOS */
export const TODOS = 'todos'
export type Ambito = string | null

export type FiltrosHistorial = {
  tipo: 'todos' | 'ingreso' | 'retiro'
  desde: string // "YYYY-MM-DD" o ''
  hasta: string
  busqueda: string
}

export const FILTROS_VACIOS: FiltrosHistorial = {
  tipo: 'todos',
  desde: '',
  hasta: '',
  busqueda: '',
}

export function hayFiltros(f: FiltrosHistorial) {
  return f.tipo !== 'todos' || Boolean(f.desde || f.hasta || f.busqueda.trim())
}

function base(supabase: SupabaseClient, ambito: Ambito, filtros: FiltrosHistorial) {
  let q = supabase.from('movimientos').select('*', { count: 'exact' })

  if (ambito === null) q = q.is('proyecto_id', null)
  else if (ambito !== TODOS) q = q.eq('proyecto_id', ambito)

  if (filtros.tipo !== 'todos') q = q.eq('tipo', filtros.tipo)

  // Días completos en la hora local del navegador
  if (filtros.desde) {
    q = q.gte('fecha', new Date(`${filtros.desde}T00:00:00`).toISOString())
  }
  if (filtros.hasta) {
    q = q.lte('fecha', new Date(`${filtros.hasta}T23:59:59.999`).toISOString())
  }

  // Quita los caracteres con significado en la sintaxis de filtros de PostgREST
  const texto = filtros.busqueda.replace(/[%_*,()\\"]/g, ' ').trim()
  if (texto) {
    q = q.or(`nota.ilike.*${texto}*,categoria.ilike.*${texto}*`)
  }

  return q.order('fecha', { ascending: false }).order('id')
}

/**
 * Una página de movimientos con los filtros aplicados en la base de datos.
 * Sirve tanto en el servidor (primera página) como en el navegador.
 */
export function consultaHistorial(
  supabase: SupabaseClient,
  ambito: Ambito,
  filtros: FiltrosHistorial,
  desdeFila = 0
) {
  return base(supabase, ambito, filtros)
    .range(desdeFila, desdeFila + TAM_PAGINA - 1)
    .returns<Movimiento[]>()
}

/** Todos los movimientos que cumplen los filtros (para exportar) */
export function todoElHistorial(
  supabase: SupabaseClient,
  ambito: Ambito,
  filtros: FiltrosHistorial
) {
  return todasLasFilas<Movimiento>((desde, hasta) =>
    base(supabase, ambito, filtros).range(desde, hasta).returns<Movimiento[]>()
  )
}
