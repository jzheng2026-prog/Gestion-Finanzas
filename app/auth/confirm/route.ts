import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Destino de los enlaces de los emails de Supabase (confirmar registro,
// recuperar contraseña). Acepta los dos formatos:
// - `?code=…` → plantillas por defecto ({{ .ConfirmationURL }}, flujo PKCE)
// - `?token_hash=…&type=…` → plantillas personalizadas
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = rutaSegura(searchParams.get('next'))

  const supabase = await createClient()

  let error: unknown = null
  if (code) {
    ;({ error } = await supabase.auth.exchangeCodeForSession(code))
  } else if (tokenHash && type) {
    ;({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }))
  } else {
    error = new Error('Enlace sin código')
  }

  if (error) {
    return NextResponse.redirect(new URL('/login?error=enlace', request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}

// Solo rutas internas: evita usar el enlace para redirigir a otra web
function rutaSegura(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard'
  }
  return next
}
