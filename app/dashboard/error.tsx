'use client'

import Link from 'next/link'
import { RotateCw } from 'lucide-react'

export default function DashboardError({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div role="alert" className="animate-fade-in-up max-w-sm text-center">
        <h1 className="font-display text-3xl font-medium">
          No se han podido cargar tus datos
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Puede ser un problema de conexión. Tus saldos no se han modificado:
          vuelve a intentarlo en unos segundos.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCw className="size-4" aria-hidden />
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
