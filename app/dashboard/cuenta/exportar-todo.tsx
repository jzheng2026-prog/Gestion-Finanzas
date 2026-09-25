'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { descargarCSV, importeCSV } from '@/lib/csv'
import { formatFechaExport, hoyISO } from '@/lib/format'
import type { Movimiento } from '@/lib/tipos'
import { todasLasFilas } from '@/lib/todas-las-filas'

/** Copia de seguridad: todos los movimientos de todos los proyectos en un CSV */
export function ExportarTodo() {
  const [exportando, setExportando] = useState(false)
  const supabase = createClient()

  async function exportar() {
    setExportando(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setExportando(false)
      toast.error('No hay sesión activa')
      return
    }

    const [movs, proyectos] = await Promise.all([
      todasLasFilas<Movimiento>((desde, hasta) =>
        supabase
          .from('movimientos')
          .select('*')
          // Solo los tuyos: en proyectos compartidos también se ven los de otros
          .eq('usuario_id', user.id)
          .order('fecha', { ascending: false })
          .order('id')
          .range(desde, hasta)
      ),
      supabase.from('proyectos').select('id, nombre'),
    ])
    setExportando(false)

    if (movs.error || proyectos.error) {
      toast.error('No se pudo exportar')
      return
    }

    const nombres = new Map((proyectos.data ?? []).map((p) => [p.id, p.nombre]))
    descargarCSV(
      [
        ['Fecha', 'Proyecto', 'Tipo', 'Monto', 'Categoría', 'Nota', 'Transferencia'],
        ...movs.data.map((m) => [
          formatFechaExport(m.fecha),
          m.proyecto_id ? (nombres.get(m.proyecto_id) ?? '') : 'Saldo general',
          m.tipo,
          importeCSV(m.monto),
          m.categoria ?? '',
          m.nota ?? '',
          m.transferencia_id ?? '',
        ]),
      ],
      `finanzas-copia-${hoyISO()}.csv`
    )
    toast.success(`Exportados ${movs.data.length} movimientos`)
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-6">
      <h2 className="mb-1 font-display text-lg">Exportar mis datos</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Todos tus movimientos, de todos los proyectos, en un CSV que abre
        Excel. Útil como copia de seguridad.
      </p>
      <button
        type="button"
        onClick={exportar}
        disabled={exportando}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted disabled:opacity-60"
      >
        {exportando ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4" aria-hidden />
        )}
        Descargar CSV
      </button>
    </div>
  )
}
