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
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { formatEUR } from '@/lib/format'
import { celebrarHito } from '@/lib/hitos'
import { useAbrirDesdeUrl } from './use-abrir-desde-url'
import { toast } from 'sonner'
import { insertarVinculados } from '@/lib/movimientos'
import { AvisoSaldo } from './aviso-saldo'

// balance y monto_objetivo son opcionales: si llegan, se celebran los hitos del destino
type Opcion = {
  id: string
  nombre: string
  balance?: number
  monto_objetivo?: number | null
}

export function TransferirForm({
  proyectos,
  defaultOrigen = 'general',
  defaultDestino = 'general',
  abrirAlInicio,
  saldos,
}: {
  proyectos: Opcion[]
  /** Saldo actual por id ('general' para el saldo general), para avisar de negativos */
  saldos?: Record<string, number>
  defaultOrigen?: string
  defaultDestino?: string
  abrirAlInicio?: boolean
}) {
  const [open, setOpen] = useAbrirDesdeUrl(abrirAlInicio)
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

    const { data: insertados, error: insertError } = await insertarVinculados(
      supabase,
      [
        [
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
        ],
      ]
    )

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
      `Transferidos ${formatEUR(cantidad)} de ${label(origen)} a ${label(destino)}`,
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

    const destinoInfo = opciones.find((o) => o.id === destino)
    if (destinoInfo?.balance !== undefined) {
      celebrarHito(
        destinoInfo.nombre,
        destinoInfo.balance,
        destinoInfo.balance + cantidad,
        destinoInfo.monto_objetivo
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted">
        <ArrowLeftRight className="size-4" aria-hidden />
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
              className="field-select"
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
              className="field-select"
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
              min="0.01"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
            <AvisoSaldo
              nombre={label(origen)}
              saldo={saldos?.[origen]}
              retiro={parseFloat(monto) || 0}
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
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
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