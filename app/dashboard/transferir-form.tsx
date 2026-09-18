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


type Opcion = { id: string; nombre: string }

export function TransferirForm({
  proyectos,
  defaultOrigen = 'general',
  defaultDestino = 'general',
}: {
  proyectos: Opcion[]
  defaultOrigen?: string
  defaultDestino?: string
}) {
  const [open, setOpen] = useState(false)
  const [origen, setOrigen] = useState(defaultOrigen)
  const [destino, setDestino] = useState(defaultDestino)
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const opciones: Opcion[] = [
    { id: 'general', nombre: 'Saldo general' },
    ...proyectos,
  ]

  function label(id: string) {
    return opciones.find((o) => o.id === id)?.nombre ?? id
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (origen === destino) {
      setError('Elige dos sitios distintos.')
      return
    }
    const cantidad = parseFloat(monto)
    if (!cantidad || cantidad <= 0) {
      setError('Introduce un monto válido.')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('No hay sesión activa.')
      setLoading(false)
      return
    }

    const { data: insertados, error: insertError } = await supabase
      .from('movimientos')
      .insert([
        {
          proyecto_id: origen === 'general' ? null : origen,
          usuario_id: user.id,
          tipo: 'retiro',
          monto: cantidad,
          nota: nota
            ? `Transferencia a ${label(destino)}: ${nota}`
            : `Transferencia a ${label(destino)}`,
        },
        {
          proyecto_id: destino === 'general' ? null : destino,
          usuario_id: user.id,
          tipo: 'ingreso',
          monto: cantidad,
          nota: nota
            ? `Transferencia desde ${label(origen)}: ${nota}`
            : `Transferencia desde ${label(origen)}`,
        },
      ])
      .select('id')

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    const idsCreados = insertados?.map((m) => m.id) ?? []

    setMonto('')
    setNota('')
    setOpen(false)
    setLoading(false)
    router.refresh()

    toast.success(
      `Transferidos ${cantidad.toFixed(2)} € de ${label(origen)} a ${label(destino)}`,
      {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            await supabase.from('movimientos').delete().in('id', idsCreados)
            router.refresh()
            toast.success('Transferencia deshecha')
          },
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-sm text-primary hover:underline">
        Transferir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            Transferir saldo
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="origen">Desde</Label>
            <select
              id="origen"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            >
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="destino">Hacia</Label>
            <select
              id="destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            >
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monto-transfer">Monto</Label>
            <Input
              id="monto-transfer"
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nota-transfer">Nota (opcional)</Label>
            <Input
              id="nota-transfer"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transferir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}