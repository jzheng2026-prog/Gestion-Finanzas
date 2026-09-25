'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function useArchivar() {
  const [archivando, setArchivando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function cambiarArchivo(id: string, nombre: string, archivar: boolean) {
    setArchivando(true)
    const { error } = await supabase
      .from('proyectos')
      .update({ archivado_en: archivar ? new Date().toISOString() : null })
      .eq('id', id)
    setArchivando(false)

    if (error) {
      toast.error(
        archivar ? 'No se pudo archivar el proyecto' : 'No se pudo restaurar el proyecto',
        { description: error.message }
      )
      return
    }

    router.refresh()
    toast.success(archivar ? `"${nombre}" archivado` : `"${nombre}" restaurado`, {
      action: {
        label: 'Deshacer',
        onClick: () => cambiarArchivo(id, nombre, !archivar),
      },
    })
  }

  return { archivando, cambiarArchivo }
}
