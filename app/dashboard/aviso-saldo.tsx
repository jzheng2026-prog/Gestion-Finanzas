import { TriangleAlert } from 'lucide-react'
import { formatEUR } from '@/lib/format'

/** Avisa (sin bloquear) si un retiro dejará el saldo en negativo */
export function AvisoSaldo({
  nombre,
  saldo,
  retiro,
}: {
  nombre: string
  saldo: number | undefined
  retiro: number
}) {
  if (saldo === undefined || retiro <= 0 || retiro <= saldo + 0.005) return null

  return (
    <p
      role="status"
      className="flex items-start gap-1.5 text-xs text-destructive"
    >
      <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
        {nombre} quedará en {formatEUR(saldo - retiro)}. Disponible:{' '}
        {formatEUR(saldo)}.
      </span>
    </p>
  )
}
