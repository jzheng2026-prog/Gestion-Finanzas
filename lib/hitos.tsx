import { toast } from 'sonner'
import { PartyPopper } from 'lucide-react'
import { hitoCruzado } from './objetivo'

const MENSAJES = {
  25: 'Primer cuarto conseguido. Buen arranque.',
  50: 'Ya vas por la mitad.',
  75: 'Tres cuartas partes. Queda poco.',
  100: 'Objetivo alcanzado. Puedes archivarlo desde su tarjeta.',
} as const

/** Muestra una celebración si el ingreso cruza el 25/50/75/100 % del objetivo */
export function celebrarHito(
  nombre: string,
  antes: number,
  despues: number,
  objetivo: number | null | undefined
) {
  const hito = hitoCruzado(antes, despues, objetivo)
  if (!hito) return

  toast(`${hito} % de ${nombre}`, {
    description: MENSAJES[hito],
    icon: <PartyPopper className="size-4 text-accent" />,
    duration: 6000,
  })
}
