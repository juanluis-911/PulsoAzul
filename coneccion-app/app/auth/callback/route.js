import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // ✅ CORRECCIÓN: Supabase envía 'token_hash', no 'token'
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  const supabase = await createClient()
  // Caso: Recovery de contraseña (token_hash + type=recovery)
  if (token_hash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery'
    })

    if (error) {
      console.error('Error verificando recovery:', error)
      return NextResponse.redirect(
        new URL(`/auth/recuperar-password?error=expired`, requestUrl.origin)
      )
    }

    return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
  }
  // Caso 1: Invitación (token_hash + type=invite)
  if (token_hash && type === 'invite') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,  // ✅ nombre correcto
      type: 'invite'
    })

    if (error) {
      console.error('Error verificando invitación:', error)
      return NextResponse.redirect(
        new URL(`/auth/login?error=invalid_invite`, requestUrl.origin)
      )
    }

    // ✅ Redirigir a completar perfil (establecer contraseña y nombre)
    return NextResponse.redirect(
      new URL('/auth/complete-profile', requestUrl.origin)
    )
  }

  // Caso 2: OAuth o magic link (code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error en callback OAuth:', error)
      return NextResponse.redirect(
        new URL('/auth/login?error=callback_error', requestUrl.origin)
      )
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // Fallback
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}