'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Archive, Check, Loader2, Pencil, Trash2 } from 'lucide-react'
import { formatEUR, formatImporte } from '@/lib/format'
import { formatMesAnio, planAhorro } from '@/lib/objetivo'
import type { Proyecto } from '@/lib/tipos'
import { EditarProyectoForm } from './editar-proyecto-form'
import { useArchivar } from './use-archivar'
import { LineaRitmo } from './linea-ritmo'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ProyectoCard({ proyecto }: { proyecto: Proyecto }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { archivando, cambiarArchivo } = useArchivar()
  const router = useRouter()
  const supabase = createClient()

  // Archivar solo está disponible si ya se ejecutó la migración
  const puedeArchivar = proyecto.archivado_en !== undefined

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', proyecto.proyecto_id)
    setDeleting(false)

    if (error) {
      toast.error('No se pudo eliminar el proyecto')
      return
    }

    setDeleteOpen(false)
    toast.success('Proyecto eliminado')
    router.refresh()
  }

  const progreso = proyecto.monto_objetivo
    ? Math.max(Math.min((proyecto.balance / proyecto.monto_objetivo) * 100, 100), 0)
    : null

  const objetivoAlcanzado =
    proyecto.monto_objetivo !== null &&
    proyecto.balance >= proyecto.monto_objetivo

  const plan = planAhorro(
    proyecto.balance,
    proyecto.monto_objetivo,
    proyecto.fecha_objetivo
  )

  return (
    <div className="group relative h-full rounded-lg border border-border bg-card p-6 transition-[transform,box-shadow,border-color] duration-300 ease-(--ease-out-expo) focus-within:border-foreground/20 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_8px_24px_-12px_rgb(28_35_33/0.18)]">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/dashboard/${proyecto.proyecto_id}`}
          className="min-w-0 flex-1 rounded-sm after:absolute after:inset-0 after:content-['']"
        >
          <p className="truncate text-sm text-muted-foreground">
            {proyecto.nombre}
          </p>
          <p
            className={`mt-1 font-display text-3xl font-medium tabular-nums ${
              proyecto.balance < 0 ? 'text-destructive' : ''
            }`}
          >
            {formatImporte(proyecto.balance)}
            <span className="text-lg text-muted-foreground"> €</span>
          </p>
        </Link>
        <div className="relative z-10 -mt-1 -mr-2 flex items-center opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="icon-action"
            aria-label={`Editar ${proyecto.nombre}`}
            title="Editar"
          >
            <Pencil className="size-4" />
          </button>
          {puedeArchivar && (
            <button
              type="button"
              onClick={() =>
                cambiarArchivo(proyecto.proyecto_id, proyecto.nombre, true)
              }
              disabled={archivando}
              className="icon-action"
              aria-label={`Archivar ${proyecto.nombre}`}
              title="Archivar"
            >
              <Archive className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="icon-action icon-action-danger"
            aria-label={`Eliminar ${proyecto.nombre}`}
            title="Eliminar"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {objetivoAlcanzado && (
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="inline-flex items-center gap-1.5 rounded-sm bg-accent/20 px-2 py-1 text-xs font-medium text-foreground">
            <Check className="size-3.5 text-primary" strokeWidth={2.5} />
            Objetivo de {formatEUR(proyecto.monto_objetivo!)} alcanzado
          </p>
          {puedeArchivar && (
            <button
              type="button"
              onClick={() =>
                cambiarArchivo(proyecto.proyecto_id, proyecto.nombre, true)
              }
              disabled={archivando}
              className="rounded-sm text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Archivar
            </button>
          )}
        </div>
      )}

      {proyecto.monto_objetivo && !objetivoAlcanzado && progreso !== null && (
        <div className="mt-5">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso)}
            aria-label={`Progreso hacia el objetivo de ${proyecto.nombre}`}
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full origin-left rounded-full bg-accent transition-[width] duration-700 ease-(--ease-out-expo)"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <p className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{progreso.toFixed(0)} %</span>
            <span>de {formatEUR(proyecto.monto_objetivo)}</span>
          </p>
          {plan && (
            <p
              className={`mt-3 text-sm tabular-nums ${
                plan.vencido ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {plan.vencido ? (
                <>Fecha superada · faltan {formatEUR(plan.restante)}</>
              ) : (
                <>
                  <span className="font-medium">{formatEUR(plan.porMes)}/mes</span>
                  <span className="text-muted-foreground">
                    {' '}
                    hasta {formatMesAnio(proyecto.fecha_objetivo!)}
                  </span>
                </>
              )}
            </p>
          )}
          <LineaRitmo
            balance={proyecto.balance}
            objetivo={proyecto.monto_objetivo}
            fechaObjetivo={proyecto.fecha_objetivo}
            creadoEn={proyecto.creado_en}
          />
        </div>
      )}

      <EditarProyectoForm
        proyecto={proyecto}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-normal">
              Eliminar &ldquo;{proyecto.nombre}&rdquo;
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el proyecto junto con todo su historial de
              movimientos ({formatEUR(proyecto.balance)} de balance actual).
              Esta acción no se puede deshacer.
              {puedeArchivar && ' Si solo quieres quitarlo de la vista, archívalo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-background hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
