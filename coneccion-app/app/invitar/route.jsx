import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cliente admin de Supabase (con Service Role Key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // ← Esta es nueva, la agregaremos
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request) {
  try {
    const { email, ninoId, rol, permisos } = await request.json()

    // Validar datos
    if (!email || !ninoId || !rol || !permisos) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Invitar usuario por email
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          nino_id: ninoId,
          rol: rol,
          permisos: permisos,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }
    )

    if (inviteError) {
      console.error('Error invitando usuario:', inviteError)
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      )
    }

    // Agregar al equipo terapéutico
    const { error: equipoError } = await supabaseAdmin
      .from('equipo_terapeutico')
      .insert({
        nino_id: ninoId,
        usuario_id: inviteData.user.id,
        rol: rol,
        permisos: permisos,
      })

    if (equipoError) {
      console.error('Error agregando al equipo:', equipoError)
      // No retornamos error porque el usuario ya fue invitado
      // Se agregará al equipo cuando acepte
    }

    return NextResponse.json({
      success: true,
      message: `Invitación enviada a ${email}`,
    })

  } catch (error) {
    console.error('Error en API invitar:', error)
    return NextResponse.json(
      { error: 'Error al procesar la invitación' },
      { status: 500 }
    )
  }
}