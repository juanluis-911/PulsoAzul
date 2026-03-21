import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('horarios_visuales')
    .select('id, nombre, tipo, mostrar_horas, actividades, created_at, user_id, nino_id, perfiles(nombre_completo), ninos(nombre)')
    .order('created_at', { ascending: false })

  if (error) {
    const { data: basic, error: basicError } = await supabase
      .from('horarios_visuales')
      .select('id, nombre, tipo, mostrar_horas, actividades, created_at, user_id, nino_id')
      .order('created_at', { ascending: false })

    if (basicError) return Response.json({ error: basicError.message }, { status: 500 })

    return Response.json(
      (basic || []).map(h => ({
        ...h,
        es_propio: h.user_id === user.id,
        creador_nombre: null,
        nino_nombre: null,
      }))
    )
  }

  const result = (data || []).map(h => ({
    ...h,
    es_propio: h.user_id === user.id,
    creador_nombre: h.perfiles?.nombre_completo || null,
    nino_nombre: h.ninos?.nombre || null,
  }))

  return Response.json(result)
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, nino_id, meta_id, tipo, mostrar_horas, actividades } = await request.json()
  if (!nombre?.trim() || !Array.isArray(actividades)) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('horarios_visuales')
    .insert({
      user_id: user.id,
      nombre: nombre.trim(),
      nino_id: nino_id || null,
      meta_id: meta_id || null,
      tipo: tipo || 'dia_completo',
      mostrar_horas: !!mostrar_horas,
      actividades,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

// Vincular / desvincular un horario de una meta
export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id, meta_id } = await request.json()
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  const { data: horario } = await supabase
    .from('horarios_visuales')
    .select('id, user_id, nino_id')
    .eq('id', id)
    .single()

  if (!horario) return Response.json({ error: 'Horario no encontrado' }, { status: 404 })

  const esCreador = horario.user_id === user.id
  let tieneAcceso = esCreador

  if (!esCreador && horario.nino_id) {
    const [{ data: esPadre }, { data: esEquipo }] = await Promise.all([
      supabase.from('ninos').select('id').eq('id', horario.nino_id).eq('padre_id', user.id).maybeSingle(),
      supabase.from('equipo_terapeutico').select('nino_id').eq('nino_id', horario.nino_id).eq('usuario_id', user.id).maybeSingle(),
    ])
    tieneAcceso = !!(esPadre || esEquipo)
  }

  if (!tieneAcceso) return Response.json({ error: 'Sin permiso' }, { status: 403 })

  const { error } = await supabase
    .from('horarios_visuales')
    .update({ meta_id: meta_id || null })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabase
    .from('horarios_visuales')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
