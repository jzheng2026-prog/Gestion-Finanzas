'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { hoyISO } from '@/lib/format'
import type { Proyecto as ProyectoCompleto } from '@/lib/tipos'

type Proyecto = Pick<
  ProyectoCompleto,
  'proyecto_id' | 'nombre' | 'monto_objetivo' | 'fecha_objetivo'
>

export function EditarProyectoForm({
  proyecto,
  open,
  onOpenChange,
}: {
  proyecto: Proyecto
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [nombre, setNombre] = useState(proyecto.nombre)
  const [objetivo, setObjetivo] = useState(
    proyecto.monto_objetivo?.toString() ?? ''
  )
  const [fechaObjetivo, setFechaObjetivo] = useState(
    proyecto.fecha_objetivo ?? ''
  )
  // La columna solo existe tras la migración; si no está, no se envía
  const hayColumnaFecha = proyecto.fecha_objetivo !== undefined
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('proyectos')
      .update({
        nombre,
        monto_objetivo: objetivo ? parseFloat(objetivo) : null,
        ...(hayColumnaFecha || fechaObjetivo
          ? { fecha_objetivo: objetivo && fechaObjetivo ? fechaObjetivo : null }
          : {}),
      })
      .eq('id', proyecto.proyecto_id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onOpenChange(false)
    toast.success('Cambios guardados')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            Editar proyecto
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre</Label>
            <Input
              id="edit-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-objetivo">Objetivo (opcional)</Label>
            <Input
              id="edit-objetivo"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
            />
          </div>
          {objetivo && (
            <div className="space-y-2">
              <Label htmlFor="edit-fecha-objetivo">¿Para cuándo? (opcional)</Label>
              <Input
                id="edit-fecha-objetivo"
                type="date"
                min={hoyISO()}
                value={fechaObjetivo}
                onChange={(e) => setFechaObjetivo(e.target.value)}
              />
            </div>
          )}
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
  )
}