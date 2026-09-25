'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Link2, Loader2, Pencil, Trash2 } from 'lucide-react'
import { formatEURConSigno, formatFecha } from '@/lib/format'
import type { Movimiento } from '@/lib/tipos'
import { useCategorias } from '../categorias-context'
import { TipoToggle } from '../tipo-toggle'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function MovimientoItem({
  movimiento,
  etiquetaProyecto,
}: {
  movimiento: Movimiento
  /** Nombre del proyecto, cuando la lista mezcla varios (búsqueda global) */
  etiquetaProyecto?: string
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [tipo, setTipo] = useState(movimiento.tipo)
  const [monto, setMonto] = useState(movimiento.monto.toString())
  const [nota, setNota] = useState(movimiento.nota ?? '')
  const [categoria, setCategoria] = useState(movimiento.categoria ?? '')
  const [fecha, setFecha] = useState(() => {
    const d = new Date(movimiento.fecha)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })
  const [loading, setLoading] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [duplicando, setDuplicando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const categorias = useCategorias(movimiento.categoria)
  const router = useRouter()
  const supabase = createClient()

  // Mitad de una transferencia o reparto: importe y fecha van a la par con
  // su pareja, y se borran juntas para que los saldos sigan cuadrando
  const vinculado = Boolean(movimiento.transferencia_id)

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const compartido = {
      monto: parseFloat(monto),
      fecha: new Date(fecha).toISOString(),
    }

    const { error } = vinculado
      ? await actualizarVinculado(compartido)
      : await supabase
          .from('movimientos')
          .update({
            ...compartido,
            tipo,
            nota: nota || null,
            categoria: categoria || null,
          })
          .eq('id', movimiento.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setEditOpen(false)
    toast.success('Movimiento actualizado')
    router.refresh()
  }

  async function actualizarVinculado(compartido: { monto: number; fecha: string }) {
    // Primero lo propio de esta mitad; luego importe y fecha en las dos
    const propio = await supabase
      .from('movimientos')
      .update({ nota: nota || null, categoria: categoria || null })
      .eq('id', movimiento.id)
    if (propio.error) return propio

    return supabase
      .from('movimientos')
      .update(compartido)
      .eq('transferencia_id', movimiento.transferencia_id!)
  }

  // Borra al momento y ofrece deshacer (vuelve a insertar las filas tal cual)
  async function handleDelete() {
    setBorrando(true)
    const consulta = supabase.from('movimientos').delete()
    const { data: borrados, error } = await (
      vinculado
        ? consulta.eq('transferencia_id', movimiento.transferencia_id!)
        : consulta.eq('id', movimiento.id)
    ).select('*')

    if (error || !borrados?.length) {
      setBorrando(false)
      toast.error('No se pudo eliminar el movimiento')
      return
    }

    router.refresh()
    toast.success(
      vinculado ? 'Se eliminaron los dos movimientos de la transferencia' : 'Movimiento eliminado',
      {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            const { error } = await supabase.from('movimientos').insert(borrados)
            if (error) {
              toast.error('No se pudo deshacer')
              return
            }
            toast.success(vinculado ? 'Transferencia restaurada' : 'Movimiento restaurado')
            router.refresh()
          },
        },
      }
    )
  }

  async function handleDuplicar() {
    setDuplicando(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setDuplicando(false)
      return
    }

    const { error } = await supabase.from('movimientos').insert({
      proyecto_id: movimiento.proyecto_id,
      usuario_id: user.id,
      tipo: movimiento.tipo,
      monto: movimiento.monto,
      nota: movimiento.nota,
      categoria: movimiento.categoria,
      fecha: new Date().toISOString(),
    })

    setDuplicando(false)

    if (error) {
      toast.error('No se pudo duplicar el movimiento')
      return
    }

    toast.success('Movimiento duplicado con la fecha de hoy')
    router.refresh()
  }

  return (
    <li
      className={`group -mx-3 flex items-center justify-between gap-3 rounded-md px-3 py-4 transition-[background-color,opacity] duration-150 focus-within:bg-muted/50 hover:bg-muted/50 ${
        borrando ? 'pointer-events-none opacity-40' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'}
          {vinculado && (
            <Link2
              className="size-3.5 text-muted-foreground"
              aria-label="Parte de una transferencia"
            />
          )}
          {etiquetaProyecto && (
            <span className="truncate font-normal text-muted-foreground">
              · {etiquetaProyecto}
            </span>
          )}
        </p>
        {(movimiento.categoria || movimiento.nota) && (
          <div className="mt-1 flex min-w-0 items-center gap-2">
            {movimiento.categoria && (
              <span className="shrink-0 rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {movimiento.categoria}
              </span>
            )}
            {movimiento.nota && (
              <p className="truncate text-sm text-muted-foreground">
                {movimiento.nota}
              </p>
            )}
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatFecha(movimiento.fecha)}
        </p>
      </div>
      {/* Móvil: importe arriba y acciones debajo. Escritorio: acciones a la izquierda
          del importe, para que los importes queden alineados al borde */}
      <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row-reverse sm:items-center sm:gap-2">
        <p
          className={`font-display text-lg whitespace-nowrap tabular-nums sm:text-xl ${
            movimiento.tipo === 'ingreso' ? 'text-primary' : 'text-destructive'
          }`}
        >
          {formatEURConSigno(
            movimiento.tipo === 'ingreso' ? movimiento.monto : -movimiento.monto
          )}
        </p>
        <div className="-mr-2 flex items-center opacity-100 transition-opacity duration-150 sm:mr-0 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          {!vinculado && (
            <button
              type="button"
              onClick={handleDuplicar}
              disabled={duplicando}
              className="icon-action"
              aria-label="Duplicar con la fecha de hoy"
              title="Duplicar con la fecha de hoy"
            >
              {duplicando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="icon-action"
            aria-label="Editar movimiento"
            title="Editar"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={borrando}
            className="icon-action icon-action-danger"
            aria-label={
              vinculado ? 'Eliminar la transferencia (las dos mitades)' : 'Eliminar movimiento'
            }
            title={vinculado ? 'Eliminar la transferencia' : 'Eliminar'}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-normal">
              Editar movimiento
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {vinculado ? (
              <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                <Link2 className="mt-px size-3.5 shrink-0" aria-hidden />
                Forma parte de una transferencia: el importe y la fecha se
                cambiarán también en el otro movimiento.
              </p>
            ) : (
              <TipoToggle value={tipo} onChange={setTipo} />
            )}
            <div className="space-y-2">
              <Label htmlFor={`monto-${movimiento.id}`}>Monto</Label>
              <Input
                id={`monto-${movimiento.id}`}
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`fecha-${movimiento.id}`}>Fecha</Label>
              <Input
                id={`fecha-${movimiento.id}`}
                type="datetime-local"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`categoria-${movimiento.id}`}>
                Categoría (opcional)
              </Label>
              <select
                id={`categoria-${movimiento.id}`}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="field-select"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`nota-${movimiento.id}`}>Nota (opcional)</Label>
              <Textarea
                id={`nota-${movimiento.id}`}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  )
}
