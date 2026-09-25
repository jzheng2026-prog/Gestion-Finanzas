'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Bookmark, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'

type Modo = 'euros' | 'porcentaje'
type Plantilla = {
  id: string
  nombre: string
  modo: Modo
  valores: Record<string, number>
}

/**
 * Guardar y aplicar repartos habituales ("Nómina": 30 % Vacaciones…).
 * Si la tabla aún no existe (migración pendiente), no se muestra.
 */
export function PlantillasReparto({
  modo,
  valores,
  idsActivos,
  onAplicar,
}: {
  modo: Modo
  valores: Record<string, string>
  idsActivos: string[]
  onAplicar: (modo: Modo, valores: Record<string, string>) => void
}) {
  // null = cargando o no disponible
  const [plantillas, setPlantillas] = useState<Plantilla[] | null>(null)
  const [seleccionada, setSeleccionada] = useState('')
  const [guardandoAbierto, setGuardandoAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const supabase = createClient()

  async function cargar() {
    const { data, error } = await supabase
      .from('plantillas_reparto')
      .select('id, nombre, modo, valores')
      .order('nombre')
    setPlantillas(error ? null : ((data ?? []) as Plantilla[]))
  }

  useEffect(() => {
    let cancelado = false
    supabase
      .from('plantillas_reparto')
      .select('id, nombre, modo, valores')
      .order('nombre')
      .then(({ data, error }) => {
        if (!cancelado) setPlantillas(error ? null : ((data ?? []) as Plantilla[]))
      })
    return () => {
      cancelado = true
    }
    // supabase es un cliente singleton
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (plantillas === null) return null

  function aplicar(id: string) {
    setSeleccionada(id)
    const p = plantillas?.find((x) => x.id === id)
    if (!p) return
    // Solo proyectos que siguen activos
    const vals = Object.fromEntries(
      Object.entries(p.valores)
        .filter(([pid]) => idsActivos.includes(pid))
        .map(([pid, v]) => [pid, String(v)])
    )
    onAplicar(p.modo, vals)
  }

  async function borrar(id: string) {
    const { error } = await supabase.from('plantillas_reparto').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo borrar la plantilla')
      return
    }
    setSeleccionada('')
    await cargar()
  }

  async function guardar() {
    const limpio = nombre.trim()
    const numericos = Object.fromEntries(
      Object.entries(valores)
        .map(([pid, v]) => [pid, parseFloat(v) || 0] as const)
        .filter(([, v]) => v > 0)
    )
    if (!limpio || Object.keys(numericos).length === 0) return

    setGuardando(true)
    const { error } = await supabase
      .from('plantillas_reparto')
      .upsert({ nombre: limpio, modo, valores: numericos }, { onConflict: 'usuario_id,nombre' })
    setGuardando(false)

    if (error) {
      toast.error('No se pudo guardar la plantilla')
      return
    }
    toast.success(`Plantilla "${limpio}" guardada`)
    setNombre('')
    setGuardandoAbierto(false)
    await cargar()
  }

  const hayValores = Object.values(valores).some((v) => (parseFloat(v) || 0) > 0)

  return (
    <div className="space-y-2">
      {plantillas.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="plantilla-reparto" className="shrink-0 text-sm text-muted-foreground">
            Plantilla
          </label>
          <select
            id="plantilla-reparto"
            value={seleccionada}
            onChange={(e) => aplicar(e.target.value)}
            className="field-select h-8"
          >
            <option value="">Elegir…</option>
            {plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.modo === 'euros' ? '€' : '%'})
              </option>
            ))}
          </select>
          {seleccionada && (
            <button
              type="button"
              onClick={() => borrar(seleccionada)}
              className="icon-action icon-action-danger shrink-0"
              aria-label="Borrar esta plantilla"
              title="Borrar esta plantilla"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {guardandoAbierto ? (
        <div className="flex gap-2">
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                guardar()
              }
            }}
            placeholder="Nombre, p. ej. Nómina"
            aria-label="Nombre de la plantilla"
            maxLength={40}
            autoFocus
          />
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || !nombre.trim()}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {guardando && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Guardar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setGuardandoAbierto(true)}
          disabled={!hayValores}
          className="inline-flex items-center gap-1.5 rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Bookmark className="size-3.5" aria-hidden />
          Guardar este reparto como plantilla
        </button>
      )}
    </div>
  )
}
