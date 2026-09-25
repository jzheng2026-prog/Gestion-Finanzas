'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export function EliminarCuenta({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const coincide = confirmacion.trim().toLowerCase() === email.toLowerCase()

  async function handleEliminar() {
    if (!coincide) return
    setEliminando(true)
    setError(null)

    const { error } = await supabase.rpc('eliminar_mi_cuenta')

    if (error) {
      setEliminando(false)
      setError(
        error.code === 'PGRST202'
          ? 'Falta configurar la eliminación de cuentas en el servidor.'
          : error.message
      )
      return
    }

    // El usuario ya no existe: limpiar la sesión local y salir
    await supabase.auth.signOut({ scope: 'local' })
    window.location.replace('/login?cuenta=eliminada')
  }

  return (
    <div className="mt-4 rounded-lg border border-destructive/30 bg-card p-6">
      <h2 className="mb-2 font-display text-lg">Eliminar cuenta</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Borra para siempre tu cuenta, tus proyectos y todos tus movimientos.
        Si quieres conservarlos, descárgalos antes en «Exportar mis datos».
      </p>
      <button
        type="button"
        onClick={() => {
          setConfirmacion('')
          setError(null)
          setOpen(true)
        }}
        className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-destructive/40 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        Eliminar mi cuenta
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-normal">
              ¿Eliminar tu cuenta?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán tu cuenta, tus proyectos y todo tu historial. No se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmar-email">
              Escribe <span className="font-medium">{email}</span> para confirmar
            </Label>
            <Input
              id="confirmar-email"
              type="email"
              autoComplete="off"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={!coincide || eliminando}
              className="bg-destructive text-background hover:bg-destructive/90"
            >
              {eliminando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar para siempre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
