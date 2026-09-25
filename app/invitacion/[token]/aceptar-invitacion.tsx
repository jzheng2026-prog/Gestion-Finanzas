'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function AceptarInvitacion({ token }: { token: string }) {
  const [aceptando, setAceptando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function aceptar() {
    setAceptando(true)
    setError(null)
    const { data: proyectoId, error } = await supabase.rpc('aceptar_invitacion', {
      p_token: token,
    })

    if (error || !proyectoId) {
      setAceptando(false)
      setError(error?.message ?? 'No se pudo aceptar la invitación.')
      return
    }

    toast.success('Ya formas parte del proyecto')
    router.replace(`/dashboard/${proyectoId}`)
    router.refresh()
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        type="button"
        onClick={aceptar}
        disabled={aceptando}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {aceptando && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Unirme al proyecto
      </button>
      <Link
        href="/dashboard"
        className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Ahora no
      </Link>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
