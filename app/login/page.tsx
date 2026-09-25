'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

function AvisoEnlace() {
  const params = useSearchParams()

  if (params.get('cuenta') === 'eliminada') {
    return (
      <p
        role="status"
        className="mt-6 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground"
      >
        Tu cuenta y todos tus datos se han eliminado.
      </p>
    )
  }

  if (params.get('error') !== 'enlace') return null
  return (
    <p
      role="alert"
      className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      El enlace ha caducado o se abrió en otro navegador. Pide uno nuevo o
      inicia sesión.
    </p>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // La redirección de usuarios ya logueados la hace proxy.ts en el servidor.
  // No volver a comprobar la sesión aquí: dos sitios decidiendo a dónde ir
  // es lo que provocaba el bucle de recarga entre /login y /dashboard.

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : error.message
      )
      setLoading(false)
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="animate-fade-in-up w-full max-w-sm">
        <h1 className="font-display text-4xl font-medium tracking-tight">
          Finanzas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ahorra por proyectos, a tu ritmo.
        </p>

        <Suspense>
          <AvisoEnlace />
        </Suspense>

        <form onSubmit={handleLogin} className="mt-10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/recuperar"
                className="rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                ¿La has olvidado?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={loading} className="h-10">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar sesión
            </Button>
            <Link
              href="/signup"
              className="rounded-sm text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ¿No tienes cuenta?{' '}
              <span className="text-primary underline-offset-4 hover:underline">
                Crea una
              </span>
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
