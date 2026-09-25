'use client'

import { ChevronRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { formatEUR } from '@/lib/format'
import type { Proyecto } from '@/lib/tipos'
import { useArchivar } from './use-archivar'

export function ProyectosArchivados({ proyectos }: { proyectos: Proyecto[] }) {
  const { archivando, cambiarArchivo } = useArchivar()

  if (proyectos.length === 0) return null

  return (
    <details className="group/archivo mt-8">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 text-sm text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="size-4 transition-transform duration-200 group-open/archivo:rotate-90"
          aria-hidden
        />
        Archivados ({proyectos.length})
      </summary>
      <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
        {proyectos.map((p) => (
          <li
            key={p.proyecto_id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <Link
              href={`/dashboard/${p.proyecto_id}`}
              className="min-w-0 truncate rounded-sm text-sm hover:underline"
            >
              {p.nombre}
            </Link>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatEUR(p.balance)}
              </span>
              <button
                type="button"
                onClick={() => cambiarArchivo(p.proyecto_id, p.nombre, false)}
                disabled={archivando}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </details>
  )
}
