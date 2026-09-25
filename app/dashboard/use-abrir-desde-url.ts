'use client'

import { useEffect, useState } from 'react'

/**
 * Estado `open` de un diálogo que puede abrirse desde la URL
 * (`/dashboard?accion=…`, usado por los accesos directos de la PWA).
 * Limpia el parámetro para que recargar no lo vuelva a abrir.
 */
export function useAbrirDesdeUrl(abrirAlInicio = false) {
  const [open, setOpen] = useState(abrirAlInicio)

  useEffect(() => {
    if (abrirAlInicio) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [abrirAlInicio])

  return [open, setOpen] as const
}
