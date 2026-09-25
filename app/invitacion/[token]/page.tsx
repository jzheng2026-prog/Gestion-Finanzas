import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AceptarInvitacion } from './aceptar-invitacion'

export const metadata: Metadata = { title: 'Invitación' }

type Estado = 'valida' | 'ya_miembro' | 'usada' | 'caducada' | 'no_existe'

const MENSAJES: Record<Exclude<Estado, 'valida' | 'ya_miembro'>, string> = {
  usada: 'Esta invitación ya se ha usado. Pide a quien te la envió que cree otra.',
  caducada: 'Esta invitación ha caducado (duran 7 días). Pide una nueva.',
  no_existe: 'Este enlace de invitación no es válido. Revisa que esté completo.',
}

// El proxy ya garantiza que hay sesión (si no, lleva al login y vuelve aquí)
export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Un token mal formado haría fallar la consulta: se trata como "no existe"
  const esUuid = /^[0-9a-f-]{36}$/i.test(token)
  const { data, error } = esUuid
    ? await supabase.rpc('ver_invitacion', { p_token: token }).single<{
        proyecto_id: string | null
        proyecto: string | null
        invitado_por: string | null
        estado: Estado
      }>()
    : { data: null, error: null }

  const estado: Estado = error ? 'no_existe' : (data?.estado ?? 'no_existe')

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="animate-fade-in-up w-full max-w-sm">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="size-5" aria-hidden />
        </span>

        {estado === 'valida' && data ? (
          <>
            <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-balance">
              Únete a «{data.proyecto}»
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {data.invitado_por ?? 'Alguien'}
              </span>{' '}
              te invita a ahorrar juntos en este proyecto. Verás el bote entero
              y podrás añadir tus propios movimientos; en tu total general solo
              contará lo que pongas tú.
            </p>
            <AceptarInvitacion token={token} />
          </>
        ) : estado === 'ya_miembro' && data?.proyecto_id ? (
          <>
            <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-balance">
              Ya estás en «{data.proyecto}»
            </h1>
            <Link
              href={`/dashboard/${data.proyecto_id}`}
              className="mt-8 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ir al proyecto
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">
              Invitación no disponible
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {MENSAJES[estado as keyof typeof MENSAJES] ?? MENSAJES.no_existe}
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-card text-sm font-medium transition-colors hover:bg-muted"
            >
              Ir a mis finanzas
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
