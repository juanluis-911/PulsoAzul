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

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let userId

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            nino_id: ninoId,
            rol: rol,
            permisos: permisos,
            rol_principal: rol,
          },
          // ✅ FIX: apuntar a /auth/login que ya sabe leer el hash con el token
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
        }
      )

      if (inviteError) {
        console.error('Error invitando usuario:', inviteError)
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }

      userId = inviteData.user.id
    }

    const { error: equipoError } = await supabaseAdmin
      .from('equipo_terapeutico')
      .upsert(
        {
          nino_id: ninoId,
          usuario_id: userId,
          rol: rol,
          permisos: permisos,
          estado: 'activo',
        },
        { onConflict: 'nino_id, usuario_id' }
      )

    if (equipoError) {
      console.error('Error agregando al equipo:', equipoError)
      return NextResponse.json({ error: 'Error al agregar al equipo' }, { status: 500 })
    }

    const mensaje = existingUser
      ? `${email} ya tiene cuenta y fue agregado al equipo del niño.`
      : `Invitación enviada a ${email}`

    return NextResponse.json({ success: true, message: mensaje })

  } catch (error) {
    console.error('Error en API invitar:', error)
    return NextResponse.json(
      { error: 'Error al procesar la invitación' },
      { status: 500 }
    )
  }
}