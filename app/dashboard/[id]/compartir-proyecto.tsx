'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Copy, Link2, Loader2, LogOut, Share2, UserMinus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Miembro } from '@/lib/tipos'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CompartirProyecto({
  proyectoId,
  nombreProyecto,
  miembros,
  miUsuarioId,
  soyPropietario,
}: {
  proyectoId: string
  nombreProyecto: string
  miembros: Miembro[]
  miUsuarioId: string
  soyPropietario: boolean
}) {
  const [enlace, setEnlace] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [quitando, setQuitando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const compartido = miembros.length > 1
  const puedeCompartirNativo = typeof navigator !== 'undefined' && 'share' in navigator

  async function crearEnlace() {
    setCreando(true)
    const { data, error } = await supabase
      .from('invitaciones')
      .insert({ proyecto_id: proyectoId })
      .select('token')
      .single()
    setCreando(false)

    if (error || !data) {
      toast.error('No se pudo crear la invitación')
      return
    }
    setEnlace(`${window.location.origin}/invitacion/${data.token}`)
    setCopiado(false)
  }

  async function copiar() {
    if (!enlace) return
    await navigator.clipboard.writeText(enlace)
    setCopiado(true)
    toast.success('Enlace copiado')
  }

  async function compartirNativo() {
    if (!enlace) return
    try {
      await navigator.share({
        title: `Únete a «${nombreProyecto}»`,
        text: `Te invito a ahorrar juntos en «${nombreProyecto}»:`,
        url: enlace,
      })
    } catch {
      // Cancelado por el usuario: nada que hacer
    }
  }

  async function quitar(usuarioId: string) {
    setQuitando(true)
    const { error } = await supabase
      .from('proyecto_miembros')
      .delete()
      .eq('proyecto_id', proyectoId)
      .eq('usuario_id', usuarioId)
    setQuitando(false)
    setConfirmando(null)

    if (error) {
      toast.error('No se pudo completar')
      return
    }

    if (usuarioId === miUsuarioId) {
      toast.success(`Has salido de «${nombreProyecto}»`)
      router.replace('/dashboard')
      router.refresh()
    } else {
      toast.success('Persona quitada del proyecto')
      router.refresh()
    }
  }

  return (
    <Dialog
      onOpenChange={(abierto) => {
        if (!abierto) {
          setConfirmando(null)
        }
      }}
    >
      <DialogTrigger className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted">
        <Users className="size-4" aria-hidden />
        {soyPropietario ? 'Compartir' : 'Personas'}
        {compartido && (
          <span className="rounded-sm bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
            {miembros.length}
          </span>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            {soyPropietario ? `Compartir «${nombreProyecto}»` : `Personas en «${nombreProyecto}»`}
          </DialogTitle>
          <DialogDescription>
            Cada persona ve el bote entero y añade sus propios movimientos. En su
            total general solo cuenta lo que ha puesto ella.
          </DialogDescription>
        </DialogHeader>

        {soyPropietario && (
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            {enlace ? (
              <>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={enlace}
                    aria-label="Enlace de invitación"
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-xs text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <button
                    type="button"
                    onClick={copiar}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {copiado ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <Copy className="size-4" aria-hidden />
                    )}
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                {puedeCompartirNativo && (
                  <button
                    type="button"
                    onClick={compartirNativo}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Share2 className="size-4" aria-hidden />
                    Enviar por WhatsApp, correo…
                  </button>
                )}
                <p className="text-xs text-muted-foreground">
                  Sirve para una sola persona y caduca en 7 días.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">
                  Crea un enlace y envíaselo a quien quieras invitar.
                </p>
                <button
                  type="button"
                  onClick={crearEnlace}
                  disabled={creando}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {creando ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Link2 className="size-4" aria-hidden />
                  )}
                  Crear enlace de invitación
                </button>
              </>
            )}
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm text-muted-foreground">
            {miembros.length === 1 ? 'Solo tú, por ahora' : `${miembros.length} personas`}
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {miembros.map((m) => {
              const soyYo = m.usuario_id === miUsuarioId
              const puedoQuitar = m.rol !== 'propietario' && (soyPropietario || soyYo)
              return (
                <li key={m.usuario_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {m.email ?? 'Sin email'}
                      {soyYo && <span className="text-muted-foreground"> (tú)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.rol === 'propietario' ? 'Creó el proyecto' : 'Miembro'}
                    </p>
                  </div>
                  {puedoQuitar &&
                    (confirmando === m.usuario_id ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setConfirmando(null)}
                          className="h-8 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted"
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => quitar(m.usuario_id)}
                          disabled={quitando}
                          className="inline-flex h-8 items-center gap-1 rounded-md bg-destructive px-2.5 text-sm font-medium text-background hover:bg-destructive/90 disabled:opacity-60"
                        >
                          {quitando && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                          {soyYo ? 'Sí, salir' : 'Sí, quitar'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmando(m.usuario_id)}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        {soyYo ? (
                          <LogOut className="size-4" aria-hidden />
                        ) : (
                          <UserMinus className="size-4" aria-hidden />
                        )}
                        {soyYo ? 'Salir' : 'Quitar'}
                      </button>
                    ))}
                </li>
              )
            })}
          </ul>
          {confirmando && (
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {confirmando === miUsuarioId
                ? 'Lo que has aportado se queda en el bote y deja de contar en tu total.'
                : 'Lo que haya aportado se queda en el bote y deja de contar en su total.'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
