'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { validarContrasena } from '@/lib/validacion'
import { Apariencia } from './apariencia'
import { EliminarCuenta } from './eliminar-cuenta'
import { CategoriasGestion } from './categorias-gestion'
import { ExportarTodo } from './exportar-todo'

export function CuentaCliente({
  recuperando,
  email,
}: {
  recuperando: boolean
  email: string
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cerrandoTodo, setCerrandoTodo] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    const errorValidacion = validarContrasena(password)
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setPassword('')
    setConfirmPassword('')
    toast.success('Contraseña actualizada')
  }

  async function handleCerrarTodo() {
    setCerrandoTodo(true)
    await supabase.auth.signOut({ scope: 'global' })
    setCerrandoTodo(false)
    toast.success('Sesión cerrada en todos los dispositivos')
    router.push('/login')
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-md px-5 pt-6 pb-16 sm:px-6 sm:pt-8">
      <Link
        href="/dashboard"
        className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>

      <h1 className="mt-8 mb-8 font-display text-4xl">Cuenta</h1>

      {recuperando && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          Has entrado con el enlace de recuperación. Elige ahora tu nueva
          contraseña.
        </p>
      )}


      <div className="rounded-lg border border-border bg-card p-6">
        <p className="mb-4 font-display text-lg">Cambiar contraseña</p>
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              autoFocus={recuperando}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, con letras y números.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Repetir contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar nueva contraseña
          </Button>
        </form>
      </div>

      <Apariencia />

      <CategoriasGestion />

      <ExportarTodo />

      <div className="mt-4 rounded-lg border border-border bg-card p-6">
        <p className="mb-2 font-display text-lg">Sesiones activas</p>
        <p className="mb-4 text-sm text-muted-foreground">
          Cierra la sesión en todos los dispositivos donde hayas iniciado
          sesión, incluido este.
        </p>
        <Button
          onClick={handleCerrarTodo}
          disabled={cerrandoTodo}
          variant="outline"
          className="w-full"
        >
          {cerrandoTodo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cerrar sesión en todos los dispositivos
        </Button>
      </div>

      {email && <EliminarCuenta email={email} />}
    </div>
  )
}
