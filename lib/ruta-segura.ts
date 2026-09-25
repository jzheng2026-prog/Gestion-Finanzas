/**
 * Devuelve `next` solo si es una ruta interna ("/algo"); si no, `porDefecto`.
 * Evita que un enlace con ?next=https://otra-web lleve fuera de la app.
 */
export function rutaSegura(next: string | null | undefined, porDefecto = '/dashboard') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return porDefecto
  }
  return next
}
