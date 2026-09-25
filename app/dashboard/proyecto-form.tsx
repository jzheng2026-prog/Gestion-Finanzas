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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { hoyISO } from '@/lib/format'

export function ProyectoForm() {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [fechaObjetivo, setFechaObjetivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('No hay sesión activa.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('proyectos').insert({
      usuario_id: user.id,
      nombre,
      monto_objetivo: objetivo ? parseFloat(objetivo) : null,
      // Solo se envía si se rellena: así funciona aunque falte la migración
      ...(objetivo && fechaObjetivo ? { fecha_objetivo: fechaObjetivo } : {}),
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setNombre('')
    setObjetivo('')
    setFechaObjetivo('')
    setOpen(false)
    setLoading(false)
    toast.success('Proyecto creado')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
        <Plus className="size-4" aria-hidden />
        Nuevo proyecto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            Nuevo proyecto
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Vacaciones"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo (opcional)</Label>
            <Input
              id="objetivo"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ej. 1000"
            />
          </div>
          {objetivo && (
            <div className="space-y-2">
              <Label htmlFor="fecha-objetivo">¿Para cuándo? (opcional)</Label>
              <Input
                id="fecha-objetivo"
                type="date"
                min={hoyISO()}
                value={fechaObjetivo}
                onChange={(e) => setFechaObjetivo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Calcularemos cuánto apartar cada mes.
              </p>
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
              Crear proyecto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}