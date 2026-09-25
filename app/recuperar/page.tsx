'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const next = encodeURIComponent('/dashboard/cuenta?recuperar=1')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${next}`,
    })

    setLoading(false)

    // Límite de envíos u otro fallo técnico: sí se muestra. Si el email no
    // existe, Supabase no da error, así que no se revela qué cuentas hay.
    if (error) {
      setError(
        error.status === 429
          ? 'Demasiados intentos. Espera un minuto y vuelve a probar.'
          : error.message
      )
      return
    }

    setEnviado(true)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="animate-fade-in-up w-full max-w-sm">
        {enviado ? (
          <>
            <h1 className="font-display text-4xl font-medium tracking-tight">
              Revisa tu email
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Si hay una cuenta con{' '}
              <span className="font-medium text-foreground">{email}</span>,
              recibirás un enlace para elegir una contraseña nueva. Ábrelo en
              este mismo navegador.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl font-medium tracking-tight">
              Recuperar contraseña
            </h1>
            <p className="mt-2 text-muted-foreground">
              Te enviaremos un enlace para crear una nueva.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
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
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading} className="h-10 w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar enlace
              </Button>
            </form>
          </>
        )}

        <Link
          href="/login"
          className="mt-6 -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al inicio de sesión
        </Link>
      </div>
    </main>
  )
}
