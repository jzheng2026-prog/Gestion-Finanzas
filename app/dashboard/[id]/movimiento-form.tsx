'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus } from 'lucide-react'
import { useCategorias } from '../categorias-context'
import { TipoToggle } from '../tipo-toggle'
import { celebrarHito } from '@/lib/hitos'
import { AvisoSaldo } from '../aviso-saldo'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

const ATAJOS = [10, 20, 50, 100]

export function MovimientoForm({
  proyectoId,
  nombreProyecto,
  balance,
  objetivo,
}: {
  proyectoId: string
  nombreProyecto: string
  balance: number
  objetivo: number | null
}) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<'ingreso' | 'retiro'>('ingreso')
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fecha, setFecha] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const categorias = useCategorias()
  const router = useRouter()
  const supabase = createClient()

  function sumarAtajo(cantidad: number) {
    const actual = parseFloat(monto) || 0
    setMonto((actual + cantidad).toFixed(2))
  }

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

    const { error } = await supabase.from('movimientos').insert({
      proyecto_id: proyectoId,
      usuario_id: user.id,
      tipo,
      monto: parseFloat(monto),
      nota: nota || null,
      fecha: new Date(fecha).toISOString(),
      categoria: categoria || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMonto('')
    setNota('')
    setCategoria('')
    setOpen(false)
    setLoading(false)
    toast.success('Movimiento guardado')
    router.refresh()

    if (tipo === 'ingreso') {
      const cantidad = parseFloat(monto)
      celebrarHito(nombreProyecto, balance, balance + cantidad, objetivo)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
        <Plus className="size-4" aria-hidden />
        Nuevo movimiento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            Nuevo movimiento
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TipoToggle value={tipo} onChange={setTipo} />
          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
            {tipo === 'retiro' && (
              <AvisoSaldo
                nombre={nombreProyecto}
                saldo={balance}
                retiro={parseFloat(monto) || 0}
              />
            )}
            <div className="flex gap-2">
              {ATAJOS.map((cantidad) => (
                <button
                  key={cantidad}
                  type="button"
                  onClick={() => sumarAtajo(cantidad)}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground tabular-nums transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  +{cantidad}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMonto('')}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría (opcional)</Label>
            <select
              id="categoria"
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
            <Label htmlFor="nota">Nota (opcional)</Label>
            <Textarea
              id="nota"
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
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
