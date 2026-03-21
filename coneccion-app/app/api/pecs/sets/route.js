import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  // RLS filtra automáticamente: ve sus propios sets + sets de niños a los que tiene acceso
  const { data, error } = await supabase
    .from('pecs_sets')
    .select('id, nombre, nino_id, pictogram_ids, created_at, user_id, perfiles(nombre_completo), ninos(nombre)')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

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

  const { nombre, nino_id, pictogram_ids } = await request.json()
  if (!nombre?.trim() || !Array.isArray(pictogram_ids)) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pecs_sets')
    .insert({ user_id: user.id, nombre: nombre.trim(), nino_id: nino_id || null, pictogram_ids })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
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
