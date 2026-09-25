/** Fila de la vista `balance_por_proyecto` + columnas extra de `proyectos` */
export type Proyecto = {
  proyecto_id: string
  nombre: string
  monto_objetivo: number | null
  /** El bote entero del proyecto (lo de todos los miembros) */
  balance: number
  // Opcionales: solo existen tras la migración 20260925_fecha_objetivo_y_archivado
  fecha_objetivo?: string | null
  archivado_en?: string | null
  /** fecha_creacion del proyecto: para saber si se va al ritmo del objetivo */
  creado_en?: string | null
  // Opcionales: solo existen tras la migración 20260928_proyectos_compartidos
  /** Lo que has puesto tú (en proyectos no compartidos, igual que balance) */
  mi_aporte?: number
  propietario_id?: string | null
  num_miembros?: number
  /** Calculado en el servidor: si el usuario actual lo creó */
  soy_propietario?: boolean
}

export type Movimiento = {
  id: string
  proyecto_id: string | null
  usuario_id?: string
  tipo: 'ingreso' | 'retiro'
  monto: number
  nota: string | null
  fecha: string
  categoria: string | null
  // Solo existe tras la migración 20260926_transferencias_y_eliminar_cuenta
  transferencia_id?: string | null
}

export type Miembro = {
  usuario_id: string
  rol: 'propietario' | 'miembro'
  email: string | null
}

/** Proyecto compartido con al menos otra persona */
export const esCompartido = (p: Pick<Proyecto, 'num_miembros'>) =>
  (p.num_miembros ?? 1) > 1

/** Tu dinero en el proyecto: tu aportación si es compartido; si no, todo */
export const miParte = (p: Pick<Proyecto, 'balance' | 'mi_aporte'>) =>
  p.mi_aporte ?? p.balance
