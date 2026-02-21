import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  
  const supabase = await createClient()

  // Caso 1: Es una invitación (token y type=invite)
  if (token && type === 'invite') {
    try {
      // Verificar el token de invitación
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'invite'
      })

      if (error) {
        console.error('Error verificando invitación:', error)
        return NextResponse.redirect(
          new URL('/auth/login?error=invalid_invite', requestUrl.origin)
        )
      }

      // Si la verificación es exitosa, el usuario necesita establecer su contraseña
      // Redirigir a la página para completar el perfil
      return NextResponse.redirect(
        new URL('/auth/complete-profile', requestUrl.origin)
      )
    } catch (error) {
      console.error('Error procesando invitación:', error)
      return NextResponse.redirect(
        new URL('/auth/login?error=invite_error', requestUrl.origin)
      )
    }
  }
  
  // Caso 2: Es un callback normal de OAuth (código de autorización)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error en callback:', error)
      return NextResponse.redirect(
        new URL('/auth/login?error=callback_error', requestUrl.origin)
      )
    }
    
    // Redirigir al dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // Si no hay ni token ni código, redirigir al login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}