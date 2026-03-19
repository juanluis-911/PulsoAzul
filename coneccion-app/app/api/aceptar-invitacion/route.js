import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * POST /api/aceptar-invitacion
 * Body: { token }
 *
 * Acepta una invitación pendiente:
 * 1. Verifica que el token exista y esté pendiente + no expirado.
 * 2. Agrega al usuario autenticado al equipo_terapeutico del niño.
 * 3. Marca la invitación como 'aceptada'.
 */
export async function POST(request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

    // ── Obtener la invitación ──────────────────────────────────────────────────
    const { data: inv, error: fetchError } = await supabaseAdmin
      .from('invitaciones')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !inv) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    if (inv.status === 'aceptada') {
      return NextResponse.json({ success: true, yaAceptada: true, ninoId: inv.nino_id })
    }

    if (inv.status === 'cancelada') {
      return NextResponse.json({ error: 'Esta invitación fue cancelada' }, { status: 410 })
    }

    if (new Date(inv.expires_at) < new Date()) {
      await supabaseAdmin
        .from('invitaciones')
        .update({ status: 'expirada' })
        .eq('id', inv.id)
      return NextResponse.json({ error: 'Esta invitación ha expirado' }, { status: 410 })
    }

    // ── Agregar al equipo del niño ─────────────────────────────────────────────
    if (inv.nino_id && inv.rol) {
      const { error: equipoError } = await supabaseAdmin
        .from('equipo_terapeutico')
        .upsert(
          {
            nino_id: inv.nino_id,
            usuario_id: user.id,
            rol: inv.rol,
            permisos: inv.permisos ?? 'edicion',
            estado: 'activo',
          },
          { onConflict: 'nino_id, usuario_id' }
        )

      if (equipoError) {
        console.error('Error agregando al equipo:', equipoError)
        return NextResponse.json({ error: 'Error al unirse al equipo' }, { status: 500 })
      }
    }

    // ── Marcar como aceptada ───────────────────────────────────────────────────
    await supabaseAdmin
      .from('invitaciones')
      .update({ status: 'aceptada', aceptada_at: new Date().toISOString() })
      .eq('id', inv.id)

    return NextResponse.json({ success: true, ninoId: inv.nino_id })

  } catch (err) {
    console.error('Error aceptando invitación:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/aceptar-invitacion
 * Body: { token }
 * Rechaza / cancela una invitación pendiente desde el punto de vista del invitado.
 */
export async function DELETE(request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

    await supabaseAdmin
      .from('invitaciones')
      .update({ status: 'cancelada' })
      .eq('token', token)
      .eq('status', 'pendiente')

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
