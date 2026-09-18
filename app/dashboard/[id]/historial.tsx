'use client'

import { useMemo, useState } from 'react'
import { MovimientoItem } from './movimiento-item'

type Movimiento = {
  id: string
  tipo: 'ingreso' | 'retiro'
  monto: number
  nota: string | null
  fecha: string
  categoria: string | null
}

function exportarCSV(movimientos: Movimiento[], nombreProyecto: string) {
  const encabezado = ['Fecha', 'Tipo', 'Monto', 'Categoría', 'Nota']
  const filas = movimientos.map((m) => [
    new Date(m.fecha).toLocaleString('es-ES'),
    m.tipo,
    m.monto.toFixed(2).replace('.', ','),
    m.categoria ?? '',
    m.nota ?? '',
  ])

  const escapar = (valor: string) =>
    /[;"\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor

  const csv = [encabezado, ...filas]
    .map((fila) => fila.map(escapar).join(';'))
    .join('\n')

  // BOM al inicio para que Excel reconozca bien los acentos en UTF-8
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${nombreProyecto}-movimientos.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function Historial({
  movimientos,
  nombreProyecto,
}: {
  movimientos: Movimiento[]
  nombreProyecto: string
}) {
  const [tipo, setTipo] = useState<'todos' | 'ingreso' | 'retiro'>('todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const filtrados = useMemo(() => {
    return movimientos.filter((m) => {
      if (tipo !== 'todos' && m.tipo !== tipo) return false
      const fecha = new Date(m.fecha)
      if (desde && fecha < new Date(desde)) return false
      if (hasta) {
        const hastaFin = new Date(hasta)
        hastaFin.setHours(23, 59, 59, 999)
        if (fecha > hastaFin) return false
      }
      return true
    })
  }, [movimientos, tipo, desde, hasta])

  const hayFiltrosActivos = tipo !== 'todos' || desde || hasta

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1">
            {(['todos', 'ingreso', 'retiro'] as const).map((opcion) => (
              <button
                key={opcion}
                onClick={() => setTipo(opcion)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                  tipo === opcion
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {opcion}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="block border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="block border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          {hayFiltrosActivos && (
            <button
              onClick={() => {
                setTipo('todos')
                setDesde('')
                setHasta('')
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <button
          onClick={() => exportarCSV(filtrados, nombreProyecto)}
          disabled={filtrados.length === 0}
          className="text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          Exportar CSV
        </button>
      </div>

      <div className="divide-y divide-border">
        {filtrados.map((m) => (
          <MovimientoItem key={m.id} movimiento={m} />
        ))}
        {filtrados.length === 0 && (
          <p className="py-4 text-muted-foreground">
            {hayFiltrosActivos
              ? 'Ningún movimiento coincide con los filtros.'
              : 'Sin movimientos todavía.'}
          </p>
        )}
      </div>
    </div>
  )
}