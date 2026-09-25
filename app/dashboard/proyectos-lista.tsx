'use client'

import { useMemo, useState } from 'react'
import { PiggyBank } from 'lucide-react'
import type { Proyecto } from '@/lib/tipos'
import { ProyectoCard } from './proyecto-card'

type Orden = 'reciente' | 'balance' | 'nombre' | 'progreso'

export function ProyectosLista({
  proyectos,
  hayArchivados = false,
}: {
  proyectos: Proyecto[]
  hayArchivados?: boolean
}) {
  const [orden, setOrden] = useState<Orden>('reciente')

  const ordenados = useMemo(() => {
    const copia = [...proyectos]
    switch (orden) {
      case 'balance':
        return copia.sort((a, b) => b.balance - a.balance)
      case 'nombre':
        return copia.sort((a, b) => a.nombre.localeCompare(b.nombre))
      case 'progreso':
        return copia.sort((a, b) => {
          const pa = a.monto_objetivo ? a.balance / a.monto_objetivo : -1
          const pb = b.monto_objetivo ? b.balance / b.monto_objetivo : -1
          return pb - pa
        })
      default:
        return copia
    }
  }, [proyectos, orden])

  if (proyectos.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
        <PiggyBank className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-4 font-display text-lg">
          {hayArchivados ? 'No tienes proyectos activos' : 'Aún no tienes proyectos'}
        </p>
        <p className="mt-1 max-w-xs text-sm text-balance text-muted-foreground">
          Crea el primero —unas vacaciones, un fondo de emergencia— y ve
          apartando dinero para él.
        </p>
      </div>
    )
  }

  return (
    <div>
      {proyectos.length > 1 && (
        <div className="mb-4 flex items-center justify-end gap-2">
          <label htmlFor="orden-proyectos" className="text-sm text-muted-foreground">
            Ordenar por
          </label>
          <select
            id="orden-proyectos"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="field-select h-8 w-auto"
          >
            <option value="reciente">Más recientes</option>
            <option value="balance">Mayor balance</option>
            <option value="progreso">Mayor progreso</option>
            <option value="nombre">Nombre (A-Z)</option>
          </select>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ordenados.map((p, i) => (
          <div
            key={p.proyecto_id}
            className="animate-fade-in-stagger"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <ProyectoCard proyecto={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
