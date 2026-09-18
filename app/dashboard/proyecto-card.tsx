'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { EditarProyectoForm } from './editar-proyecto-form'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'


type Proyecto = {
  proyecto_id: string
  nombre: string
  monto_objetivo: number | null
  balance: number
}

export function ProyectoCard({ proyecto }: { proyecto: Proyecto }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('proyectos').delete().eq('id', proyecto.proyecto_id)
    setDeleting(false)
    setDeleteOpen(false)
    toast.success('Proyecto eliminado')
    router.refresh()
  }

  const progreso = proyecto.monto_objetivo
    ? Math.min((proyecto.balance / proyecto.monto_objetivo) * 100, 100)
    : null

  return (
    <div className="group relative border-l-2 border-primary bg-card p-5">
      <div className="flex items-start justify-between">
        <Link href={`/dashboard/${proyecto.proyecto_id}`} className="flex-1">
          <p className="text-sm text-muted-foreground">{proyecto.nombre}</p>
          <p className="font-display text-3xl font-medium tabular-nums">
            {proyecto.balance.toFixed(2)}
            <span className="text-lg text-muted-foreground"> €</span>
          </p>
        </Link>
        <div className="flex items-center gap-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={() => setEditOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Editar proyecto"
          >
            ✎
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Eliminar proyecto"
          >
            ×
          </button>
        </div>
      </div>

      {proyecto.monto_objetivo && (
        <div className="mt-4">
          <div className="h-1 w-full overflow-hidden bg-muted">
            <div
              className="h-full bg-accent"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {progreso?.toFixed(0)}% de {proyecto.monto_objetivo.toFixed(2)} €
          </p>
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
              movimientos ({proyecto.balance.toFixed(2)} € de balance actual).
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
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