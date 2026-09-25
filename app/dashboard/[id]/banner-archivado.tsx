'use client'

import { Archive, RotateCcw } from 'lucide-react'
import { useArchivar } from '../use-archivar'

export function BannerArchivado({ id, nombre }: { id: string; nombre: string }) {
  const { archivando, cambiarArchivo } = useArchivar()

  return (
    <div
      role="status"
      className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3"
    >
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Archive className="size-4" aria-hidden />
        Proyecto archivado: no aparece en el dashboard.
      </p>
      <button
        type="button"
        onClick={() => cambiarArchivo(id, nombre, false)}
        disabled={archivando}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
      >
        <RotateCcw className="size-3.5" aria-hidden />
        Restaurar
      </button>
    </div>
  )
}
