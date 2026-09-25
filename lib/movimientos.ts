import type { SupabaseClient } from '@supabase/supabase-js'

type FilaMovimiento = {
  proyecto_id: string | null
  usuario_id: string
  tipo: 'ingreso' | 'retiro'
  monto: number
  nota: string | null
}

/**
 * Inserta pares retiro/ingreso (transferencias, repartos) compartiendo un
 * `transferencia_id`, en una sola petición: o se guardan todas las filas o
 * ninguna. Si la columna aún no existe (migración pendiente), las guarda sin
 * vínculo para no bloquear la operación.
 */
export async function insertarVinculados(
  supabase: SupabaseClient,
  pares: [FilaMovimiento, FilaMovimiento][]
) {
  const filas = pares.flatMap(([retiro, ingreso]) => {
    const transferencia_id = crypto.randomUUID()
    return [
      { ...retiro, transferencia_id },
      { ...ingreso, transferencia_id },
    ]
  })

  const res = await supabase.from('movimientos').insert(filas).select('id')

  if (res.error?.message.includes('transferencia_id')) {
    const sinVinculo = filas.map((f) => {
      const copia: Partial<typeof f> = { ...f }
      delete copia.transferencia_id
      return copia
    })
    return supabase.from('movimientos').insert(sinVinculo).select('id')
  }

  return res
}
