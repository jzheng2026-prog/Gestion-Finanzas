// Supabase (PostgREST) devuelve como máximo 1.000 filas por petición.
// Para "todo" (gráficas, exportaciones) hay que pedirlo por bloques.
const BLOQUE = 1000

type Resultado<T> = PromiseLike<{
  data: T[] | null
  error: { message: string } | null
}>

/**
 * Lee todas las filas de una consulta, bloque a bloque.
 * `consulta(desde, hasta)` debe devolver la consulta con `.range(desde, hasta)`
 * y un orden estable.
 */
export async function todasLasFilas<T>(
  consulta: (desde: number, hasta: number) => Resultado<T>
): Promise<{ data: T[]; error: { message: string } | null }> {
  const filas: T[] = []
  for (let desde = 0; ; desde += BLOQUE) {
    const { data, error } = await consulta(desde, desde + BLOQUE - 1)
    if (error) return { data: filas, error }
    filas.push(...(data ?? []))
    if (!data || data.length < BLOQUE) return { data: filas, error: null }
  }
}
