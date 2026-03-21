import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  // Intentar query enriquecido con joins (requiere FKs en Supabase)
  const { data, error } = await supabase
    .from('pecs_sets')
    .select('id, nombre, nino_id, pictogram_ids, created_at, user_id, perfiles(nombre_completo), ninos(nombre)')
    .order('created_at', { ascending: false })

  // Si el join falla (FK no declarada), caer al query básico
  // SIN filtrar por user_id: la RLS se encarga de la visibilidad
  if (error) {
    const { data: basic, error: basicError } = await supabase
      .from('pecs_sets')
      .select('id, nombre, nino_id, pictogram_ids, created_at, user_id')
      .order('created_at', { ascending: false })

    if (basicError) return Response.json({ error: basicError.message }, { status: 500 })

    return Response.json(
      (basic || []).map(s => ({
        ...s,
        es_propio: s.user_id === user.id,
        creador_nombre: null,
        nino_nombre: null,
      }))
    )
  }

  // Marcar cuáles son propios para distinguirlos en el frontend
  const result = (data || []).map(s => ({
    ...s,
    es_propio: s.user_id === user.id,
    creador_nombre: s.perfiles?.nombre_completo || null,
    nino_nombre: s.ninos?.nombre || null,
  }))

  return Response.json(result)
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, nino_id, meta_id, pictogram_ids } = await request.json()
  if (!nombre?.trim() || !Array.isArray(pictogram_ids)) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pecs_sets')
    .insert({
      user_id: user.id,
      nombre: nombre.trim(),
      nino_id: nino_id || null,
      meta_id: meta_id || null,
      pictogram_ids,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

// Vincular / desvincular un set de una meta
export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id, meta_id } = await request.json()
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  // Verificar que el set existe y que el usuario tiene acceso al niño al que pertenece
  const { data: set } = await supabase
    .from('pecs_sets')
    .select('id, user_id, nino_id')
    .eq('id', id)
    .single()

  if (!set) return Response.json({ error: 'Set no encontrado' }, { status: 404 })

  // Permitir si es el creador del set O si tiene acceso al niño (equipo terapéutico / padre)
  const esCreador = set.user_id === user.id
  let tieneAcceso = esCreador

  if (!esCreador && set.nino_id) {
    const [{ data: espadre }, { data: esEquipo }] = await Promise.all([
      supabase.from('ninos').select('id').eq('id', set.nino_id).eq('padre_id', user.id).maybeSingle(),
      supabase.from('equipo_terapeutico').select('nino_id').eq('nino_id', set.nino_id).eq('usuario_id', user.id).maybeSingle(),
    ])
    tieneAcceso = !!(espadre || esEquipo)
  }

  if (!tieneAcceso) return Response.json({ error: 'Sin permiso' }, { status: 403 })

  // Actualizar meta_id directamente (sin restricción RLS adicional, ya verificamos arriba)
  const { error } = await supabase
    .from('pecs_sets')
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
    .from('pecs_sets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
