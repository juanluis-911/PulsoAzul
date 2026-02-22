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

  // Refrescar sesión (siempre necesario con @supabase/ssr)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Rutas de /dashboard → requieren auth + suscripción activa ─────────────
  if (pathname.startsWith('/dashboard')) {

    // 1. Sin sesión → login
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 2. Con sesión → verificar suscripción en Supabase
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .eq('id', user.id)
      .maybeSingle()

    const hasAccess = sub?.status === 'active' || sub?.status === 'trialing'

    // Si canceló pero el período aún no venció, seguimos dando acceso
    const periodEnded = sub?.current_period_end
      ? new Date(sub.current_period_end) < new Date()
      : true

    const stillActive = sub?.cancel_at_period_end && !periodEnded

    if (!hasAccess && !stillActive) {
      const pricingUrl = new URL('/pricing', request.url)
      // Pasamos el motivo para mostrar mensaje en la página
      pricingUrl.searchParams.set(
        'reason',
        sub?.status === 'past_due' ? 'payment_failed' : 'no_subscription'
      )
      return NextResponse.redirect(pricingUrl)
    }
  }

  // ── Rutas de auth → redirigir al dashboard si ya está autenticado ─────────
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
    if (user) {
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