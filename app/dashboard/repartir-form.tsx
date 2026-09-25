'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Split } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatEUR } from '@/lib/format'
import { celebrarHito } from '@/lib/hitos'
import { insertarVinculados } from '@/lib/movimientos'
import type { Proyecto } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAbrirDesdeUrl } from './use-abrir-desde-url'
import { PlantillasReparto } from './plantillas-reparto'

type Modo = 'euros' | 'porcentaje'

const redondear = (n: number) => Math.round(n * 100) / 100

export function RepartirForm({
  saldoGeneral,
  proyectos,
  abrirAlInicio,
}: {
  saldoGeneral: number
  proyectos: Proyecto[]
  abrirAlInicio?: boolean
}) {
  const [open, setOpen] = useAbrirDesdeUrl(abrirAlInicio)
  const [importe, setImporte] = useState(
    saldoGeneral > 0 ? saldoGeneral.toFixed(2) : ''
  )
  const [modo, setModo] = useState<Modo>('euros')
  const [valores, setValores] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const total = parseFloat(importe) || 0

  const repartos = useMemo(
    () =>
      proyectos
        .map((p) => {
          const valor = parseFloat(valores[p.proyecto_id] ?? '') || 0
          const monto = redondear(modo === 'euros' ? valor : (total * valor) / 100)
          return { proyecto: p, monto }
        })
        .filter((r) => r.monto > 0),
    [proyectos, valores, modo, total]
  )

  const repartido = redondear(repartos.reduce((acc, r) => acc + r.monto, 0))
  const queda = redondear(total - repartido)
  const excede = queda < 0

  function handleOpenChange(abierto: boolean) {
    setOpen(abierto)
    if (abierto) {
      setImporte(saldoGeneral > 0 ? saldoGeneral.toFixed(2) : '')
      setValores({})
      setError(null)
    }
  }

  function asignarResto(id: string) {
    const actual = parseFloat(valores[id] ?? '') || 0
    const resto = modo === 'euros' ? queda + actual : total ? (queda / total) * 100 + actual : 0
    if (resto <= 0) return
    setValores((v) => ({ ...v, [id]: redondear(resto).toString() }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (total <= 0) {
      setError('Introduce el importe a repartir.')
      return
    }
    if (repartos.length === 0) {
      setError('Asigna una cantidad a al menos un proyecto.')
      return
    }
    if (excede) {
      setError(`Estás repartiendo ${formatEUR(-queda)} más de lo disponible.`)
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

    // Un único insert: o se guardan todas las filas o ninguna
    const { data: insertados, error: insertError } = await insertarVinculados(
      supabase,
      repartos.map(({ proyecto, monto }) => [
        {
          proyecto_id: null,
          usuario_id: user.id,
          tipo: 'retiro',
          monto,
          nota: `Reparto a ${proyecto.nombre}`,
        },
        {
          proyecto_id: proyecto.proyecto_id,
          usuario_id: user.id,
          tipo: 'ingreso',
          monto,
          nota: 'Reparto desde saldo general',
        },
      ])
    )

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    const ids = insertados?.map((m) => m.id) ?? []
    setOpen(false)
    router.refresh()

    toast.success(
      `Repartidos ${formatEUR(repartido)} entre ${repartos.length} ${
        repartos.length === 1 ? 'proyecto' : 'proyectos'
      }`,
      {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            await supabase.from('movimientos').delete().in('id', ids)
            router.refresh()
            toast.success('Reparto deshecho')
          },
        },
      }
    )

    for (const { proyecto, monto } of repartos) {
      celebrarHito(
        proyecto.nombre,
        proyecto.balance,
        proyecto.balance + monto,
        proyecto.monto_objetivo
      )
    }
  }

  if (proyectos.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted">
        <Split className="size-4" aria-hidden />
        Repartir
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            Repartir saldo general
          </DialogTitle>
          <DialogDescription>
            Disponible:{' '}
            <span className="font-medium text-foreground tabular-nums">
              {formatEUR(saldoGeneral)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="importe-reparto">Importe a repartir</Label>
              <Input
                id="importe-reparto"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-1" role="group" aria-label="Repartir en">
              <button
                type="button"
                onClick={() => {
                  setModo('euros')
                  setValores({})
                }}
                aria-pressed={modo === 'euros'}
                className="segment h-8 px-3"
              >
                €
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo('porcentaje')
                  setValores({})
                }}
                aria-pressed={modo === 'porcentaje'}
                className="segment h-8 px-3"
              >
                %
              </button>
            </div>
          </div>

          <PlantillasReparto
            modo={modo}
            valores={valores}
            idsActivos={proyectos.map((p) => p.proyecto_id)}
            onAplicar={(m, v) => {
              setModo(m)
              setValores(v)
            }}
          />

          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const id = `reparto-${p.proyecto_id}`
              const monto = repartos.find((r) => r.proyecto.proyecto_id === p.proyecto_id)?.monto
              return (
                <li key={p.proyecto_id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={id} className="block truncate text-sm">
                      {p.nombre}
                    </label>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      <span className="whitespace-nowrap">{formatEUR(p.balance)}</span>
                      {p.monto_objetivo ? (
                        <span className="whitespace-nowrap">
                          {' '}
                          de {formatEUR(p.monto_objetivo)}
                        </span>
                      ) : null}
                      {modo === 'porcentaje' && monto ? (
                        <span className="whitespace-nowrap"> · +{formatEUR(monto)}</span>
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => asignarResto(p.proyecto_id)}
                    disabled={queda <= 0}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  >
                    Resto
                  </button>
                  <div className="relative w-28">
                    <Input
                      id={id}
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={valores[p.proyecto_id] ?? ''}
                      onChange={(e) =>
                        setValores((v) => ({ ...v, [p.proyecto_id]: e.target.value }))
                      }
                      className="pr-7 text-right tabular-nums"
                      placeholder="0"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                      {modo === 'euros' ? '€' : '%'}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="space-y-1 border-t border-border pt-4 text-sm tabular-nums">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Repartido</span>
              <span className="font-medium">{formatEUR(repartido)}</span>
            </p>
            <p className={`flex justify-between ${excede ? 'text-destructive' : ''}`}>
              <span className={excede ? '' : 'text-muted-foreground'}>
                {excede ? 'Te pasas en' : 'Queda en saldo general'}
              </span>
              <span className="font-medium">{formatEUR(Math.abs(queda))}</span>
            </p>
            {total > saldoGeneral && !excede && (
              <p className="pt-1 text-xs text-muted-foreground">
                El importe supera el saldo general: quedará en negativo.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading || excede} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Repartir {repartido > 0 ? formatEUR(repartido) : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
