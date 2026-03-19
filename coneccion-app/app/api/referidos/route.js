import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * GET /api/referidos
 * Devuelve estadísticas + lista de referidos del usuario autenticado.
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: referidos } = await supabaseAdmin
      .from('referidos')
      .select('*')
      .eq('referidor_id', user.id)
      .order('created_at', { ascending: false })

    const lista = referidos ?? []

    const stats = {
      total:       lista.length,
      registrados: lista.filter(r => r.status === 'registrado' || r.status === 'suscrito').length,
      suscritos:   lista.filter(r => r.status === 'suscrito').length,
      pendientes:  lista.filter(r => r.status === 'pendiente').length,
      bonos:       lista.filter(r => r.bono_otorgado).length,
    }

    return NextResponse.json({ referidos: lista, stats })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/referidos
 * Body: { email, nombre? }
 * Crea una invitación personalizada (tipo='email') para referir a alguien.
 */
export async function POST(request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { email, nombre } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    // No permitir invitarse a sí mismo
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'No puedes invitarte a ti mismo' }, { status: 400 })
    }

    // Verificar si ya hay una invitación pendiente para este email
    const { data: existente } = await supabaseAdmin
      .from('referidos')
      .select('id, status')
      .eq('referidor_id', user.id)
      .eq('email_invitado', email.toLowerCase())
      .in('status', ['pendiente', 'registrado'])
      .maybeSingle()

    if (existente) {
      return NextResponse.json({ error: 'Ya existe una invitación activa para ese email' }, { status: 409 })
    }

    const { data: inv, error } = await supabaseAdmin
      .from('referidos')
      .insert({
        referidor_id: user.id,
        tipo: 'email',
        email_invitado: email.toLowerCase(),
        nombre_invitado: nombre || null,
        status: 'pendiente',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando referido:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, referido: inv })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/referidos
 * Body: { ref, userId, nombre }
 *
 * Llamado desde la página de registro cuando alguien se registró con un ?ref=.
 * - Si `ref` es un token en referidos.token → actualiza esa invitación personalizada.
 * - Si `ref` es un UUID de usuario → crea un nuevo referido tipo='link'.
 */
export async function PATCH(request) {
  try {
    const { ref, userId, nombre } = await request.json()
    if (!ref || !userId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    // Caso 1: ¿es un token de invitación personalizada?
    const { data: invEmail } = await supabaseAdmin
      .from('referidos')
      .select('id, referidor_id, status')
      .eq('token', ref)
      .eq('tipo', 'email')
      .maybeSingle()

    if (invEmail) {
      // No actualizar si ya fue registrado/cancelado
      if (invEmail.status !== 'pendiente') {
        return NextResponse.json({ success: true, note: 'Ya procesado' })
      }
      await supabaseAdmin
        .from('referidos')
        .update({
          invitado_user_id: userId,
          nombre_invitado: nombre || null,
          status: 'registrado',
          registrado_at: new Date().toISOString(),
        })
        .eq('id', invEmail.id)

      return NextResponse.json({ success: true, tipo: 'email' })
    }

    // Caso 2: el `ref` es el userId del referidor (link personal)
    // Verificar que el referidor existe y no es el mismo usuario
    if (ref === userId) return NextResponse.json({ success: true, note: 'Mismo usuario' })

    const { data: referidor } = await supabaseAdmin.auth.admin.getUserById(ref)
    if (!referidor?.user) return NextResponse.json({ success: true, note: 'Referidor no encontrado' })

    // Evitar duplicados (por si el usuario ya fue vinculado)
    const { data: dup } = await supabaseAdmin
      .from('referidos')
      .select('id')
      .eq('referidor_id', ref)
      .eq('invitado_user_id', userId)
      .maybeSingle()

    if (dup) return NextResponse.json({ success: true, note: 'Duplicado' })

    await supabaseAdmin
      .from('referidos')
      .insert({
        referidor_id: ref,
        tipo: 'link',
        invitado_user_id: userId,
        nombre_invitado: nombre || null,
        status: 'registrado',
        registrado_at: new Date().toISOString(),
      })

    return NextResponse.json({ success: true, tipo: 'link' })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/referidos
 * Body: { referidoId }
 * Cancela una invitación personalizada pendiente.
 */
export async function DELETE(request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { referidoId } = await request.json()
    if (!referidoId) return NextResponse.json({ error: 'Falta referidoId' }, { status: 400 })

    await supabaseAdmin
      .from('referidos')
      .update({ status: 'cancelado' })
      .eq('id', referidoId)
      .eq('referidor_id', user.id)
      .eq('status', 'pendiente')

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
