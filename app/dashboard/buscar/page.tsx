import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { consultaHistorial, FILTROS_VACIOS, TODOS } from '@/lib/historial'
import { Historial } from '../[id]/historial'

export const metadata: Metadata = { title: 'Buscar' }

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const filtros = { ...FILTROS_VACIOS, busqueda: q }
  const supabase = await createClient()

  const [{ data: movimientos, count, error }, { data: proyectos }] =
    await Promise.all([
      consultaHistorial(supabase, TODOS, filtros),
      supabase.from('proyectos').select('id, nombre'),
    ])

  if (error) {
    throw new Error(error.message)
  }

  const nombres = Object.fromEntries(
    (proyectos ?? []).map((p) => [p.id as string, p.nombre as string])
  )

  return (
    <div className="mx-auto max-w-4xl px-5 pt-6 pb-16 sm:px-6 sm:pt-8">
      <Link
        href="/dashboard"
        className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>

      <main className="animate-fade-in-up">
        <h1 className="mt-8 mb-2 font-display text-4xl">Buscar movimientos</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          En todos tus proyectos y en el saldo general.
        </p>

        <Historial
          proyectoId={TODOS}
          movimientos={movimientos ?? []}
          total={count ?? 0}
          nombreProyecto="busqueda"
          filtrosIniciales={filtros}
          nombresProyectos={nombres}
          autoFocusBusqueda
          textoVacio="Aún no tienes movimientos."
        />
      </main>
    </div>
  )
}
