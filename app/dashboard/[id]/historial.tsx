'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatFechaExport } from '@/lib/format'
import { descargarCSV, importeCSV } from '@/lib/csv'
import {
  consultaHistorial,
  FILTROS_VACIOS,
  hayFiltros,
  TAM_PAGINA,
  todoElHistorial,
  type Ambito,
  type FiltrosHistorial,
} from '@/lib/historial'
import type { Movimiento } from '@/lib/tipos'
import { MovimientoItem } from './movimiento-item'

const OPCIONES_TIPO = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'ingreso', etiqueta: 'Ingresos' },
  { valor: 'retiro', etiqueta: 'Retiros' },
] as const

type Lista = { clave: string; items: Movimiento[]; total: number }

const claveDe = (f: FiltrosHistorial) => JSON.stringify(f)

export function Historial({
  proyectoId,
  movimientos,
  total,
  nombreProyecto,
  textoVacio = 'Sin movimientos todavía. Añade el primero con «Nuevo movimiento».',
  filtrosIniciales = FILTROS_VACIOS,
  nombresProyectos,
  autoFocusBusqueda = false,
  miUsuarioId,
  autores,
}: {
  /** Id de proyecto, null (saldo general) o TODOS (búsqueda global) */
  proyectoId: Ambito
  /** Primera página, cargada en el servidor */
  movimientos: Movimiento[]
  total: number
  nombreProyecto: string
  textoVacio?: string
  /** Filtros con los que se cargó la primera página en el servidor */
  filtrosIniciales?: FiltrosHistorial
  /** Para mostrar a qué proyecto pertenece cada movimiento (búsqueda global) */
  nombresProyectos?: Record<string, string>
  autoFocusBusqueda?: boolean
  /** En proyectos compartidos: para marcar autor y bloquear lo ajeno */
  miUsuarioId?: string
  autores?: Record<string, string>
}) {
  const [filtros, setFiltros] = useState<FiltrosHistorial>(filtrosIniciales)
  const claveInicial = claveDe(filtrosIniciales)
  const [lista, setLista] = useState<Lista | null>(null)
  const [cargando, setCargando] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [exportando, setExportando] = useState(false)
  const supabase = createClient()

  // Tras guardar o borrar algo, router.refresh() trae una primera página
  // nueva: se descarta lo cargado para no mostrar datos viejos
  const [inicialesPrevias, setInicialesPrevias] = useState(movimientos)
  if (inicialesPrevias !== movimientos) {
    setInicialesPrevias(movimientos)
    setLista(null)
  }

  const clave = claveDe(filtros)
  const actual: Lista =
    lista && (lista.clave === clave || clave !== claveInicial)
      ? lista
      : { clave: claveInicial, items: movimientos, total }

  // Con filtros, la consulta se hace en la base de datos (todo el historial)
  useEffect(() => {
    let cancelado = false
    const temporizador = setTimeout(
      async () => {
        if (clave === claveInicial) {
          setLista(null)
          setCargando(false)
          return
        }
        const { data, count, error } = await consultaHistorial(
          supabase,
          proyectoId,
          filtros
        )
        if (cancelado) return
        setCargando(false)
        if (error) {
          toast.error('No se pudo filtrar el historial')
          return
        }
        setLista({ clave, items: data ?? [], total: count ?? 0 })
      },
      filtros.busqueda ? 300 : 0
    )
    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
    // supabase es estable (cliente singleton); `movimientos` relanza tras un refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, claveInicial, proyectoId, movimientos])

  function cambiarFiltros(cambio: Partial<FiltrosHistorial>) {
    setFiltros((f) => ({ ...f, ...cambio }))
    setCargando(true)
  }

  async function cargarMas() {
    setCargandoMas(true)
    const { data, count, error } = await consultaHistorial(
      supabase,
      proyectoId,
      filtros,
      actual.items.length
    )
    setCargandoMas(false)
    if (error) {
      toast.error('No se pudieron cargar más movimientos')
      return
    }
    setLista({
      clave,
      items: [...actual.items, ...(data ?? [])],
      total: count ?? actual.total,
    })
  }

  async function exportar() {
    setExportando(true)
    const { data, error } = await todoElHistorial(supabase, proyectoId, filtros)
    setExportando(false)
    if (error) {
      toast.error('No se pudo exportar')
      return
    }
    descargarCSV(
      [
        ['Fecha', 'Tipo', 'Monto', 'Categoría', 'Nota'],
        ...data.map((m) => [
          formatFechaExport(m.fecha),
          m.tipo,
          importeCSV(m.monto),
          m.categoria ?? '',
          m.nota ?? '',
        ]),
      ],
      `${nombreProyecto}-movimientos.csv`
    )
  }

  const conFiltros = hayFiltros(filtros)
  const quedan = actual.total - actual.items.length

  if (total === 0 && !hayFiltros(filtrosIniciales) && !conFiltros) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-balance text-muted-foreground">
        {textoVacio}
      </p>
    )
  }

  return (
    <div>
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            autoFocus={autoFocusBusqueda}
            value={filtros.busqueda}
            onChange={(e) => cambiarFiltros({ busqueda: e.target.value })}
            placeholder="Buscar por nota o categoría"
            aria-label="Buscar por nota o categoría"
            className="h-9 w-full rounded-lg border border-input bg-transparent pr-3 pl-9 text-sm transition-colors outline-none placeholder:text-muted-foreground hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-1" role="group" aria-label="Filtrar por tipo">
              {OPCIONES_TIPO.map(({ valor, etiqueta }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => cambiarFiltros({ tipo: valor })}
                  aria-pressed={filtros.tipo === valor}
                  className="segment"
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <label
                  htmlFor={`filtro-desde-${proyectoId ?? 'general'}`}
                  className="text-xs text-muted-foreground"
                >
                  Desde
                </label>
                <input
                  id={`filtro-desde-${proyectoId ?? 'general'}`}
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => cambiarFiltros({ desde: e.target.value })}
                  className="block h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor={`filtro-hasta-${proyectoId ?? 'general'}`}
                  className="text-xs text-muted-foreground"
                >
                  Hasta
                </label>
                <input
                  id={`filtro-hasta-${proyectoId ?? 'general'}`}
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => cambiarFiltros({ hasta: e.target.value })}
                  className="block h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
            {conFiltros && (
              <button
                type="button"
                onClick={() => {
                  setFiltros(FILTROS_VACIOS)
                  setCargando(true)
                }}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden />
                Limpiar filtros
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={exportar}
            disabled={actual.total === 0 || exportando}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-primary transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:text-muted-foreground"
          >
            {exportando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            Exportar CSV
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {cargando ? 'Buscando…' : `${actual.total} movimientos`}
      </p>

      <div
        className={`transition-opacity duration-150 ${cargando ? 'opacity-50' : ''}`}
        aria-busy={cargando}
      >
        {actual.items.length > 0 ? (
          <ul className="divide-y divide-border">
            {actual.items.map((m) => (
              <MovimientoItem
                key={m.id}
                movimiento={m}
                etiquetaProyecto={
                  nombresProyectos
                    ? m.proyecto_id
                      ? (nombresProyectos[m.proyecto_id] ?? 'Proyecto')
                      : 'Saldo general'
                    : undefined
                }
                autor={
                  miUsuarioId && m.usuario_id && m.usuario_id !== miUsuarioId
                    ? (autores?.[m.usuario_id] ?? 'Antiguo miembro')
                    : undefined
                }
                editable={!miUsuarioId || !m.usuario_id || m.usuario_id === miUsuarioId}
              />
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {cargando ? 'Buscando…' : 'Ningún movimiento coincide con los filtros.'}
          </p>
        )}
      </div>

      {actual.items.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {quedan > 0 && (
            <button
              type="button"
              onClick={cargarMas}
              disabled={cargandoMas || cargando}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted disabled:opacity-60"
            >
              {cargandoMas && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Cargar {Math.min(quedan, TAM_PAGINA)} más
            </button>
          )}
          <p className="text-xs text-muted-foreground tabular-nums">
            {actual.items.length === actual.total
              ? `${actual.total} ${actual.total === 1 ? 'movimiento' : 'movimientos'}`
              : `Mostrando ${actual.items.length} de ${actual.total}`}
          </p>
        </div>
      )}
    </div>
  )
}
