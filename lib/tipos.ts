/** Fila de la vista `balance_por_proyecto` + columnas extra de `proyectos` */
export type Proyecto = {
  proyecto_id: string
  nombre: string
  monto_objetivo: number | null
  balance: number
  // Opcionales: solo existen tras la migración 20260925_fecha_objetivo_y_archivado
  fecha_objetivo?: string | null
  archivado_en?: string | null
  /** created_at del proyecto: para saber si se va al ritmo del objetivo */
  creado_en?: string | null
}

export type Movimiento = {
  id: string
  proyecto_id: string | null
  tipo: 'ingreso' | 'retiro'
  monto: number
  nota: string | null
  fecha: string
  categoria: string | null
  // Solo existe tras la migración 20260926_transferencias_y_eliminar_cuenta
  transferencia_id?: string | null
}
