import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Solo para quien no ha iniciado sesión: si ya la tiene, se le lleva al dashboard
const RUTAS_ANONIMAS = ['/login', '/signup', '/recuperar']
// Accesibles con o sin sesión (el enlace del email puede abrirse estando logueado)
const RUTAS_PUBLICAS = [...RUTAS_ANONIMAS, '/auth']

export async function proxy(request: NextRequest) {
  // Cookies de sesión refrescadas por Supabase durante getUser()
  const cookiesRefrescadas: {
    name: string
    value: string
    options?: Parameters<NextResponse['cookies']['set']>[2]
  }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            cookiesRefrescadas.push({ name, value, options })
          })
        },
      },
    }
  )

  // getClaims() valida el JWT localmente (con claves asimétricas) en vez de
  // hacer una petición a Supabase Auth en cada navegación, como getUser().
  // Con claves simétricas antiguas hace la petición igualmente: nunca es
  // menos seguro.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
    ? { id: data.claims.sub, email: data.claims.email as string | undefined }
    : null

  const { pathname } = request.nextUrl
  const coincide = (ruta: string) =>
    pathname === ruta || pathname.startsWith(`${ruta}/`)
  const esRutaPublica = RUTAS_PUBLICAS.some(coincide)
  const esRutaAnonima = RUTAS_ANONIMAS.some(coincide)

  let response: NextResponse

  if (!user && !esRutaPublica) {
    response = NextResponse.redirect(new URL('/login', request.url))
  } else if (user && esRutaAnonima) {
    response = NextResponse.redirect(new URL('/dashboard', request.url))
  } else {
    // Las páginas leen la identidad de estos headers en vez de volver a
    // llamar a getUser(). Se sobrescriben siempre para que el cliente no
    // pueda inyectarlos.
    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete('x-user-id')
    requestHeaders.delete('x-user-email')
    if (user) {
      requestHeaders.set('x-user-id', user.id)
      requestHeaders.set('x-user-email', user.email ?? '')
    }
    response = NextResponse.next({ request: { headers: requestHeaders } })
  }

  cookiesRefrescadas.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
