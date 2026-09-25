'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

const OPCIONES = [
  { valor: 'light', etiqueta: 'Claro', Icono: Sun },
  { valor: 'dark', etiqueta: 'Oscuro', Icono: Moon },
  { valor: 'system', etiqueta: 'Sistema', Icono: Monitor },
] as const

const sinSuscripcion = () => () => {}

export function Apariencia() {
  const { theme, setTheme } = useTheme()
  // El tema guardado solo se conoce en el navegador: hasta hidratar no se
  // marca ninguna opción, para no desajustar el HTML del servidor
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false)

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-6">
      <h2 className="mb-1 font-display text-lg">Apariencia</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        «Sistema» sigue el modo claro u oscuro de tu dispositivo.
      </p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tema">
        {OPCIONES.map(({ valor, etiqueta, Icono }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setTheme(valor)}
            aria-pressed={montado && theme === valor}
            className="segment inline-flex items-center justify-center gap-1.5 py-2"
          >
            <Icono className="size-4" aria-hidden />
            {etiqueta}
          </button>
        ))}
      </div>
    </div>
  )
}
