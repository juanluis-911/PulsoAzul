import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Rutas de /dashboard → requieren auth + acceso válido ──────────────────
  if (pathname.startsWith('/dashboard')) {

    // 1. Sin sesión → login
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 2. Maestros y terapeutas → acceso gratuito siempre
    const { data: equipoRow } = await supabase
      .from('equipo_terapeutico')
      .select('rol')
      .eq('usuario_id', user.id)
      .in('rol', ['maestra_sombra', 'terapeuta'])
      .limit(1)
      .maybeSingle()

    if (equipoRow) return response

    // 3. Para padres → verificar acceso
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .eq('id', user.id)
      .maybeSingle()

    // ✅ CAMBIO: Trial sin tarjeta
    // Si NO tiene registro en subscriptions → es un usuario nuevo en free trial.
    // Calculamos los días desde que se registró (created_at de auth.users).
    if (!sub) {
      const createdAt = new Date(user.created_at)
      const now = new Date()
      const diasTranscurridos = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))
      const TRIAL_DIAS = 30

      if (diasTranscurridos <= TRIAL_DIAS) {
        // Dentro del trial → dejar pasar, inyectar días restantes en header
        const diasRestantes = TRIAL_DIAS - diasTranscurridos
        response.headers.set('x-trial-dias-restantes', String(diasRestantes))
        return response
      } else {
        // Trial vencido sin suscripción → redirigir a pricing
        const pricingUrl = new URL('/pricing', request.url)
        pricingUrl.searchParams.set('reason', 'trial_expired')
        return NextResponse.redirect(pricingUrl)
      }
    }

    // 4. Tiene registro en subscriptions → verificar status normal
    const hasAccess = sub.status === 'active' || sub.status === 'trialing'
    const periodEnded = sub.current_period_end
      ? new Date(sub.current_period_end) < new Date()
      : true
    const stillActive = sub.cancel_at_period_end && !periodEnded

    if (!hasAccess && !stillActive) {
      const pricingUrl = new URL('/pricing', request.url)
      pricingUrl.searchParams.set(
        'reason',
        sub.status === 'past_due' ? 'payment_failed' : 'no_subscription'
      )
      return NextResponse.redirect(pricingUrl)
    }
  }

  // ── Rutas de auth → redirigir al dashboard si ya está autenticado ─────────
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
    const hasInviteParam = request.nextUrl.searchParams.has('invited')
    const hasErrorParam  = request.nextUrl.searchParams.has('error')

    if (user && !hasInviteParam && !hasErrorParam) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}