'use client'

import { createContext, useContext, useMemo } from 'react'
import { CATEGORIAS } from './categorias'

export type CategoriaPersonal = { id: string; nombre: string }

const Contexto = createContext<CategoriaPersonal[]>([])

/** Categorías propias del usuario, cargadas una vez en app/dashboard/layout.tsx */
export function CategoriasProvider({
  personalizadas,
  children,
}: {
  personalizadas: CategoriaPersonal[]
  children: React.ReactNode
}) {
  return <Contexto.Provider value={personalizadas}>{children}</Contexto.Provider>
}

export function useCategoriasPersonales() {
  return useContext(Contexto)
}

/**
 * Predefinidas + propias, con "Otros" al final. Si `actual` no está en la
 * lista (p. ej. una categoría propia ya borrada), se añade para no perderla
 * al editar un movimiento antiguo.
 */
export function useCategorias(actual?: string | null) {
  const personales = useContext(Contexto)
  return useMemo(() => {
    const predefinidas = CATEGORIAS.filter((c) => c !== 'Otros')
    const propias = personales
      .map((c) => c.nombre)
      .filter((n) => !(CATEGORIAS as readonly string[]).includes(n))
      .sort((a, b) => a.localeCompare(b, 'es'))
    const lista: string[] = [...predefinidas, ...propias, 'Otros']
    if (actual && !lista.includes(actual)) lista.push(actual)
    return lista
  }, [personales, actual])
}
