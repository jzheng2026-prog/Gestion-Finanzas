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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ProyectoForm() {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [objetivo, setObjetivo] = useState('')
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
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setNombre('')
    setObjetivo('')
    setOpen(false)
    setLoading(false)
    toast.success('Proyecto creado')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
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
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ej. 1000"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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