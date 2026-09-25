import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatEUR } from '@/lib/format'
import { ritmoAhorro } from '@/lib/objetivo'

/** "Vas 120,00 € por detrás del ritmo" (o por delante), si hay datos para saberlo */
export function LineaRitmo({
  balance,
  objetivo,
  fechaObjetivo,
  creadoEn,
}: {
  balance: number
  objetivo: number | null | undefined
  fechaObjetivo: string | null | undefined
  creadoEn: string | null | undefined
}) {
  const ritmo = ritmoAhorro(balance, objetivo, fechaObjetivo, creadoEn)
  if (!ritmo) return null

  if (ritmo.estado === 'al-dia') {
    return <p className="mt-1 text-xs text-muted-foreground">Vas al ritmo previsto.</p>
  }

  const detras = ritmo.estado === 'detras'
  const Icono = detras ? TrendingDown : TrendingUp
  return (
    <p
      className={`mt-1 inline-flex items-center gap-1 text-xs tabular-nums ${
        detras ? 'text-destructive' : 'text-primary'
      }`}
    >
      <Icono className="size-3.5 shrink-0" aria-hidden />
      Vas {formatEUR(Math.abs(ritmo.diferencia))} por {detras ? 'detrás' : 'delante'} del
      ritmo
    </p>
  )
}
