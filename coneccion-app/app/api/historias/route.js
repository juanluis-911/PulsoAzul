import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('historias_sociales')
    .select('id, titulo, paginas, created_at, user_id, nino_id, meta_id, ninos(nombre)')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(
    (data || []).map(h => ({
      ...h,
      es_propio: h.user_id === user.id,
      nino_nombre: h.ninos?.nombre || null,
    }))
  )
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { titulo, nino_id, meta_id, paginas } = await request.json()
  if (!titulo?.trim() || !Array.isArray(paginas)) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('historias_sociales')
    .insert({ user_id: user.id, titulo: titulo.trim(), nino_id: nino_id || null, meta_id: meta_id || null, paginas })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id, meta_id } = await request.json()
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  const { data: historia } = await supabase.from('historias_sociales').select('id, user_id, nino_id').eq('id', id).single()
  if (!historia) return Response.json({ error: 'No encontrada' }, { status: 404 })

  const esCreador = historia.user_id === user.id
  let tieneAcceso = esCreador

  if (!esCreador && historia.nino_id) {
    const [{ data: esPadre }, { data: esEquipo }] = await Promise.all([
      supabase.from('ninos').select('id').eq('id', historia.nino_id).eq('padre_id', user.id).maybeSingle(),
      supabase.from('equipo_terapeutico').select('nino_id').eq('nino_id', historia.nino_id).eq('usuario_id', user.id).maybeSingle(),
    ])
    tieneAcceso = !!(esPadre || esEquipo)
  }

  if (!tieneAcceso) return Response.json({ error: 'Sin permiso' }, { status: 403 })

  const { error } = await supabase.from('historias_sociales').update({ meta_id: meta_id || null }).eq('id', id)
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

  const { error } = await supabase.from('historias_sociales').delete().eq('id', id).eq('user_id', user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
