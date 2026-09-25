// Las páginas se renderizan en el servidor (UTC en Vercel) y se hidratan en
// el navegador. Fijar la zona horaria evita horas desplazadas y avisos de
// hidratación por fechas que no coinciden entre servidor y cliente.
export const ZONA_HORARIA = 'Europe/Madrid'

const eur = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
})

// Intl usa el guion (-) para negativos; el signo menos (−) se lee mejor en cifras
const menos = (texto: string) => texto.replace('-', '−')

/** 1234.5 → "1.234,50" (sin símbolo, para poder estilizar el € aparte) */
export function formatImporte(valor: number) {
  return menos(eur.format(valor))
}

/** 1234.5 → "1.234,50 €" */
export function formatEUR(valor: number) {
  return `${menos(eur.format(valor))} €`
}

/** Igual que formatEUR pero siempre con signo: "+12,00 €" / "−12,00 €" */
export function formatEURConSigno(valor: number) {
  const signo = valor > 0 ? '+' : valor < 0 ? '−' : ''
  return `${signo}${eur.format(Math.abs(valor))} €`
}

const fechaHora = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: ZONA_HORARIA,
})

export function formatFecha(fecha: string) {
  return fechaHora.format(new Date(fecha))
}

const fechaCorta = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  timeZone: ZONA_HORARIA,
})

/** "05 sept" — para ejes de gráficas */
export function formatFechaCorta(fecha: string) {
  return fechaCorta.format(new Date(fecha))
}

/** Fecha y hora completas para exportar (CSV) */
export function formatFechaExport(fecha: string) {
  return new Date(fecha).toLocaleString('es-ES', { timeZone: ZONA_HORARIA })
}

export function nombreMes(fecha = new Date()) {
  return fecha.toLocaleDateString('es-ES', {
    month: 'long',
    timeZone: ZONA_HORARIA,
  })
}

/** Desfase en minutos de ZONA_HORARIA respecto a UTC en un instante dado */
function desfaseMinutos(instante: Date) {
  const nombre = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    timeZoneName: 'longOffset',
  })
    .formatToParts(instante)
    .find((p) => p.type === 'timeZoneName')?.value // "GMT+02:00"
  const m = nombre?.match(/GMT([+-])(\d{2}):(\d{2})/)
  if (!m) return 0
  const minutos = Number(m[2]) * 60 + Number(m[3])
  return m[1] === '-' ? -minutos : minutos
}

/**
 * Instante (UTC) en que empieza el mes en ZONA_HORARIA.
 * `mesesAtras = 0` → mes actual, `1` → mes anterior…
 */
export function inicioDeMes(mesesAtras = 0, ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(ahora)
  const anio = Number(partes.find((p) => p.type === 'year')!.value)
  const mes = Number(partes.find((p) => p.type === 'month')!.value) - 1

  // Medianoche del día 1 como si fuera UTC, corregida con el desfase real
  const aprox = new Date(Date.UTC(anio, mes - mesesAtras, 1))
  return new Date(aprox.getTime() - desfaseMinutos(aprox) * 60_000)
}

/** Fecha de hoy en ZONA_HORARIA como "YYYY-MM-DD" (para <input type="date">) */
export function hoyISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date())
}

/** Nombre corto para mostrar a una persona: la parte del email antes de la @ */
export function nombreCorto(email: string | null | undefined) {
  return email ? email.split('@')[0] : 'Alguien'
}
