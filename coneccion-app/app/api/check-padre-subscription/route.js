import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET /api/check-padre-subscription?ninoId=xxx
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ninoId = searchParams.get('ninoId')
    if (!ninoId) {
      return NextResponse.json({ error: 'ninoId requerido' }, { status: 400 })
    }

    // 1. Obtener el padre del niño
    const { data: nino, error: ninoError } = await supabaseAdmin
      .from('ninos')
      .select('padre_id')
      .eq('id', ninoId)
      .maybeSingle()

    if (ninoError || !nino) {
      return NextResponse.json({ error: 'Niño no encontrado' }, { status: 404 })
    }

    const padreId = nino.padre_id

    // 2. Obtener el perfil del usuario actual para saber su rol
    const { data: equipoRow } = await supabaseAdmin
      .from('equipo_terapeutico')
      .select('rol')
      .eq('nino_id', ninoId)
      .eq('usuario_id', user.id)
      .maybeSingle()

    // Si es el mismo padre, usamos su propia suscripción
    const targetUserId = (user.id === padreId) ? padreId : padreId

    // 3. Verificar suscripción del padre
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .eq('id', targetUserId)
      .maybeSingle()

    const isActive = (() => {
      if (!sub) return false
      if (sub.status === 'active' || sub.status === 'trialing') return true
      if (sub.cancel_at_period_end && sub.current_period_end) {
        return new Date(sub.current_period_end) > new Date()
      }
      return false
    })()

    return NextResponse.json({
      padreId,
      padreHaPagado: isActive,
      rol: equipoRow?.rol ?? (user.id === padreId ? 'padre' : null),
    })

  } catch (err) {
    console.error('[check-padre-subscription]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}