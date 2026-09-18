'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CATEGORIAS } from '../categorias'

  type Movimiento = {
  id: string
  tipo: 'ingreso' | 'retiro'
  monto: number
  nota: string | null
  fecha: string
  categoria: string | null
}

export function MovimientoItem({ movimiento }: { movimiento: Movimiento }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('movimientos')
      .update({
        tipo,
        monto: parseFloat(monto),
        nota: nota || null,
        fecha: new Date(fecha).toISOString(),
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

  async function handleDelete() {
    setLoading(true)
    await supabase.from('movimientos').delete().eq('id', movimiento.id)
    setLoading(false)
    setDeleteOpen(false)
    toast.success('Movimiento eliminado')
    router.refresh()
  }

  return (
    <div className="group flex items-center justify-between py-4">
      <div>
        <p className="text-sm font-medium">
          {movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'}
        </p>
        <div className="flex items-center gap-2">
          {movimiento.categoria && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5">
              {movimiento.categoria}
            </span>
          )}
          {movimiento.nota && (
            <p className="text-sm text-muted-foreground">{movimiento.nota}</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(movimiento.fecha).toLocaleString('es-ES')}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <p
          className={`font-display text-xl tabular-nums ${
            movimiento.tipo === 'ingreso' ? 'text-primary' : 'text-destructive'
          }`}
        >
          {movimiento.tipo === 'ingreso' ? '+' : '−'}
          {movimiento.monto.toFixed(2)} €
        </p>
        <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={() => setEditOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Editar movimiento"
          >
            ✎
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Eliminar movimiento"
          >
            ×
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipo('ingreso')}
                className={`flex-1 border py-2 text-sm transition-colors ${
                  tipo === 'ingreso'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setTipo('retiro')}
                className={`flex-1 border py-2 text-sm transition-colors ${
                  tipo === 'retiro'
                    ? 'border-destructive bg-destructive text-white'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Retiro
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`monto-${movimiento.id}`}>Monto</Label>
              <Input
                id={`monto-${movimiento.id}`}
                type="number"
                step="0.01"
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
              <Label htmlFor={`nota-${movimiento.id}`}>Nota (opcional)</Label>
              <Textarea
                id={`nota-${movimiento.id}`}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-normal">
              Eliminar movimiento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará {movimiento.tipo === 'ingreso' ? 'el ingreso' : 'el retiro'} de{' '}
              {movimiento.monto.toFixed(2)} €. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}