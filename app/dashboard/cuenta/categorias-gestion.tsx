'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { CATEGORIAS } from '../categorias'
import { useCategoriasPersonales } from '../categorias-context'

export function CategoriasGestion() {
  const personales = useCategoriasPersonales()
  const [nueva, setNueva] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function añadir(e: React.FormEvent) {
    e.preventDefault()
    const nombre = nueva.trim()
    if (!nombre) return
    setError(null)

    const existentes = [...CATEGORIAS, ...personales.map((c) => c.nombre)]
    if (existentes.some((c) => c.toLowerCase() === nombre.toLowerCase())) {
      setError('Esa categoría ya existe.')
      return
    }

    setGuardando(true)
    const { error } = await supabase.from('categorias').insert({ nombre })
    setGuardando(false)

    if (error) {
      setError(
        error.code === '42P01' || error.message.includes('categorias')
          ? 'Falta ejecutar la migración de categorías en Supabase.'
          : error.message
      )
      return
    }

    setNueva('')
    router.refresh()
  }

  async function borrar(id: string, nombre: string) {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo borrar la categoría')
      return
    }
    router.refresh()
    // Los movimientos antiguos conservan el texto de la categoría
    toast.success(`"${nombre}" borrada`, {
      description: 'Los movimientos que la usaban la conservan.',
      action: {
        label: 'Deshacer',
        onClick: async () => {
          await supabase.from('categorias').insert({ nombre })
          router.refresh()
        },
      },
    })
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-6">
      <h2 className="mb-1 font-display text-lg">Categorías</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Además de las predefinidas, puedes crear las tuyas.
      </p>

      <ul className="mb-4 flex flex-wrap gap-1.5" aria-label="Categorías disponibles">
        {CATEGORIAS.map((c) => (
          <li
            key={c}
            className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
          >
            {c}
          </li>
        ))}
        {personales.map((c) => (
          <li
            key={c.id}
            className="inline-flex items-center gap-1 rounded-md border border-border py-0.5 pr-0.5 pl-2.5 text-xs"
          >
            {c.nombre}
            <button
              type="button"
              onClick={() => borrar(c.id, c.nombre)}
              className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Borrar la categoría ${c.nombre}`}
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={añadir} className="flex gap-2">
        <Input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nueva categoría"
          aria-label="Nueva categoría"
          maxLength={40}
          className="h-9"
        />
        <button
          type="submit"
          disabled={guardando || !nueva.trim()}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {guardando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          Añadir
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
