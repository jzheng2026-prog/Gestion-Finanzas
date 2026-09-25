import { createClient } from '@/lib/supabase/server'
import { CategoriasProvider, type CategoriaPersonal } from './categorias-context'

// Carga una vez, para todo /dashboard, las categorías propias del usuario
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  // Si la tabla aún no existe (migración pendiente), se usan solo las predefinidas
  const { data } = await supabase
    .from('categorias')
    .select('id, nombre')
    .order('nombre')

  return (
    <CategoriasProvider personalizadas={(data ?? []) as CategoriaPersonal[]}>
      {children}
    </CategoriasProvider>
  )
}
