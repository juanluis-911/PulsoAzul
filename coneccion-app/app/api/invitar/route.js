import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * POST /api/invitar
 * Body: { email, ninoId, rol, permisos }
 *
 * Crea un registro en `invitaciones` (status=pendiente).
 * - Si el email ya tiene cuenta: envía push notification con enlace a /invitacion/[token].
 * - Si es nuevo: llama a inviteUserByEmail (Supabase envía el correo) y guarda el token
 *   en user_metadata para que complete-profile lo use al finalizar.
 */
export async function POST(request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { email, ninoId, rol, permisos } = await request.json()
    if (!email || !ninoId || !rol || !permisos) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // ── Datos de contexto ──────────────────────────────────────────────────────
    const [{ data: nino }, { data: perfilInvitador }] = await Promise.all([
      supabaseAdmin.from('ninos').select('nombre, apellido').eq('id', ninoId).single(),
      supabaseAdmin.from('perfiles').select('nombre_completo').eq('id', user.id).single(),
    ])

    const nombreNino    = nino ? `${nino.nombre} ${nino.apellido}` : 'el niño'
    const nombreInvitador = perfilInvitador?.nombre_completo ?? user.email

    // ── Guardar invitación ─────────────────────────────────────────────────────
    const { data: inv, error: invError } = await supabaseAdmin
      .from('invitaciones')
      .insert({
        tipo: 'equipo',
        invitado_por: user.id,
        email_invitado: email.toLowerCase(),
        nino_id: ninoId,
        nombre_nino: nombreNino,
        rol,
        permisos,
        status: 'pendiente',
      })
      .select()
      .single()

    if (invError) {
      console.error('Error guardando invitación:', invError)
      return NextResponse.json({ error: 'Error al crear la invitación' }, { status: 500 })
    }

    const token = inv.token

    // ── ¿El email ya tiene cuenta? ─────────────────────────────────────────────
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    const rolLabel = rol === 'terapeuta' ? 'Terapeuta' : 'Maestra Sombra'

    if (existingUser) {
      // ── Enviar push notification ───────────────────────────────────────────
      webpush.setVapidDetails(
        process.env.VAPID_MAILTO,
        process.env.NEXT_PUBLIC_VAPID_KEY,
        process.env.VAPID_PRIVATE_KEY
      )

      const { data: subs } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('usuario_id', existingUser.id)

      if (subs?.length) {
        const payload = JSON.stringify({
          title: `Invitación de ${nombreInvitador.split(' ')[0]}`,
          body: `Te invita a acompañar a ${nombreNino} como ${rolLabel}`,
          url: `/invitacion/${token}`,
        })
        await Promise.allSettled(
          subs.map(({ subscription }) =>
            webpush.sendNotification(subscription, payload).catch(() => {})
          )
        )
      }

      return NextResponse.json({
        success: true,
        message: `${email} ya tiene cuenta en Pulso Azul. Se le envió una notificación para que acepte la invitación.`,
        existingUser: true,
        token,
      })
    }

    // ── Nuevo usuario: enviar email de invitación vía Supabase ─────────────────
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          nino_id: ninoId,
          rol,
          permisos,
          rol_principal: rol,
          invitacion_token: token,   // lo leerá complete-profile para redirigir
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
      }
    )

    if (inviteError) {
      await supabaseAdmin.from('invitaciones').delete().eq('id', inv.id)
      console.error('Error invitando usuario:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Invitación enviada a ${email}. Recibirá un correo para unirse al equipo.`,
      existingUser: false,
      token,
    })

  } catch (error) {
    console.error('Error en API invitar:', error)
    return NextResponse.json({ error: 'Error al procesar la invitación' }, { status: 500 })
  }
}

/**
 * GET /api/invitar
 * Devuelve las invitaciones enviadas por el usuario autenticado.
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: invitaciones } = await supabaseAdmin
      .from('invitaciones')
      .select('id, token, email_invitado, nombre_nino, rol, permisos, status, created_at, expires_at, aceptada_at')
      .eq('invitado_por', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ invitaciones: invitaciones ?? [] })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/invitar
 * Body: { invitacionId }
 * Cancela una invitación pendiente enviada por el usuario autenticado.
 */
export async function DELETE(request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { invitacionId } = await request.json()
    if (!invitacionId) return NextResponse.json({ error: 'Falta invitacionId' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('invitaciones')
      .update({ status: 'cancelada' })
      .eq('id', invitacionId)
      .eq('invitado_por', user.id)   // solo el dueño puede cancelar
      .eq('status', 'pendiente')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
