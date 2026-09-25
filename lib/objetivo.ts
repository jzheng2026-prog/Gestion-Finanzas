const DIA_MS = 86_400_000
const DIAS_POR_MES = 30.4375

export type PlanAhorro =
  | { vencido: false; restante: number; meses: number; porMes: number }
  | { vencido: true; restante: number }

/**
 * Cuánto hay que apartar al mes para llegar al objetivo en la fecha fijada.
 * Devuelve null si no hay objetivo, no hay fecha o ya se ha alcanzado.
 */
export function planAhorro(
  balance: number,
  objetivo: number | null | undefined,
  fechaObjetivo: string | null | undefined,
  hoy = new Date()
): PlanAhorro | null {
  if (!objetivo || !fechaObjetivo) return null
  const restante = objetivo - balance
  if (restante <= 0) return null

  // fecha_objetivo es un `date` ("2027-03-31"): cuenta hasta el final de ese día
  const limite = new Date(`${fechaObjetivo}T23:59:59Z`)
  const dias = (limite.getTime() - hoy.getTime()) / DIA_MS
  if (dias < 0) return { vencido: true, restante }

  const meses = Math.max(1, Math.ceil(dias / DIAS_POR_MES))
  return { vencido: false, restante, meses, porMes: restante / meses }
}

const mesAnio = new Intl.DateTimeFormat('es-ES', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "2027-03-31" → "mar 2027" */
export function formatMesAnio(fecha: string) {
  return mesAnio.format(new Date(`${fecha}T00:00:00Z`))
}

const HITOS = [25, 50, 75, 100] as const
export type Hito = (typeof HITOS)[number]

/** El mayor hito (25/50/75/100 %) que se cruza al pasar de `antes` a `despues` */
export function hitoCruzado(
  antes: number,
  despues: number,
  objetivo: number | null | undefined
): Hito | null {
  if (!objetivo || objetivo <= 0) return null
  const pAntes = (antes / objetivo) * 100
  const pDespues = (despues / objetivo) * 100
  return [...HITOS].reverse().find((h) => pAntes < h && pDespues >= h) ?? null
}

const MARGEN_RITMO = 0.02 // ±2 % del objetivo se considera "al ritmo"
const DIAS_MINIMOS_RITMO = 7 // antes no hay tendencia que valorar

/**
 * Compara lo ahorrado con lo que tocaría a estas alturas si se ahorrase de
 * forma lineal desde que se creó el proyecto hasta la fecha objetivo.
 * Devuelve la diferencia (negativa = por detrás) o null si no aplica.
 */
export function ritmoAhorro(
  balance: number,
  objetivo: number | null | undefined,
  fechaObjetivo: string | null | undefined,
  creadoEn: string | null | undefined,
  hoy = new Date()
): { diferencia: number; estado: 'detras' | 'al-dia' | 'delante' } | null {
  if (!objetivo || !fechaObjetivo || !creadoEn || balance >= objetivo) return null

  const inicio = new Date(creadoEn).getTime()
  const fin = new Date(`${fechaObjetivo}T23:59:59Z`).getTime()
  const ahora = hoy.getTime()
  if (fin <= inicio || ahora >= fin) return null
  if ((ahora - inicio) / DIA_MS < DIAS_MINIMOS_RITMO) return null

  const esperado = objetivo * ((ahora - inicio) / (fin - inicio))
  const diferencia = balance - esperado
  const margen = objetivo * MARGEN_RITMO

  return {
    diferencia,
    estado:
      diferencia < -margen ? 'detras' : diferencia > margen ? 'delante' : 'al-dia',
  }
}
