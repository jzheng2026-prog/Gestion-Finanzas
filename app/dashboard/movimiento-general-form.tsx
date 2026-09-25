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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCategorias } from './categorias-context'
import { TipoToggle } from './tipo-toggle'
import { useAbrirDesdeUrl } from './use-abrir-desde-url'
import { AvisoSaldo } from './aviso-saldo'

export function MovimientoGeneralForm({
  abrirAlInicio,
  saldoGeneral,
}: {
  abrirAlInicio?: boolean
  saldoGeneral?: number
}) {
  const [open, setOpen] = useAbrirDesdeUrl(abrirAlInicio)
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
      proyecto_id: null,
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
    setOpen(false)
    setLoading(false)
    toast.success('Movimiento guardado')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted">
        <Plus className="size-4" aria-hidden />
        <span className="sm:hidden">Añadir</span>
        <span className="hidden sm:inline">Añadir al saldo general</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            Movimiento general
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TipoToggle value={tipo} onChange={setTipo} />
          <div className="space-y-2">
            <Label htmlFor="monto-general">Monto</Label>
            <Input
              id="monto-general"
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
                nombre="El saldo general"
                saldo={saldoGeneral}
                retiro={parseFloat(monto) || 0}
              />
            )}
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
            <Label htmlFor="nota-general">Nota (opcional)</Label>
            <Textarea
              id="nota-general"
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