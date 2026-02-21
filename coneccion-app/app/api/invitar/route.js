import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
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

    if (!email || !ninoId || !rol || !permisos) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          nino_id: ninoId,
          rol: rol,
          permisos: permisos,
          rol_principal: rol, // ✅ Agregado: lo usamos en complete-profile
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }
    )

    if (inviteError) {
      console.error('Error invitando usuario:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // ✅ Insertar en equipo_terapeutico solo si no existe ya
    const { error: equipoError } = await supabaseAdmin
      .from('equipo_terapeutico')
      .upsert(
        {
          nino_id: ninoId,
          usuario_id: inviteData.user.id,
          rol: rol,
          permisos: permisos,
          estado: 'activo',
        },
        { onConflict: 'nino_id, usuario_id' } // evita duplicados si se reinvita
      )

    if (equipoError) {
      console.error('Error agregando al equipo:', equipoError)
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