import webpush from 'web-push'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * POST /api/notificar-reaccion-registro
 * Body: { registroId, emoji }
 *
 * Notifica a todo el equipo del niño cuando alguien reacciona a un registro diario.
 * Excluye al propio autor de la reacción y al creador del registro (ya lo vio).
 */
export async function POST(request) {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    const { registroId, emoji } = await request.json()
    if (!registroId || !emoji) return Response.json({ error: 'Faltan datos' }, { status: 400 })

    // ── Obtener datos del registro y el niño ─────────────────────────────
    const { data: registro } = await supabaseAdmin
      .from('registros_diarios')
      .select('nino_id, fecha, creado_por, ninos(nombre, apellido)')
      .eq('id', registroId)
      .single()

    if (!registro) return Response.json({ error: 'Registro no encontrado' }, { status: 404 })

    const ninoId     = registro.nino_id
    const nombreNino = registro.ninos
      ? `${registro.ninos.nombre} ${registro.ninos.apellido}`
      : 'el niño'
    const fechaStr   = new Date(registro.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    // ── Nombre del que reacciona ─────────────────────────────────────────
    const { data: perfilReactor } = await supabaseAdmin
      .from('perfiles')
      .select('nombre_completo')
      .eq('id', user.id)
      .single()

    const nombreReactor = perfilReactor?.nombre_completo?.split(' ')[0] ?? 'Alguien'

    // ── Equipo del niño (excluir al reactor) ─────────────────────────────
    const { data: equipo } = await supabaseAdmin
      .from('equipo_terapeutico')
      .select('usuario_id')
      .eq('nino_id', ninoId)
      .neq('usuario_id', user.id)

    if (!equipo?.length) return Response.json({ enviados: 0 })

    const usuarioIds = equipo.map(m => m.usuario_id)

    // ── Suscripciones push ───────────────────────────────────────────────
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription, usuario_id')
      .in('usuario_id', usuarioIds)

    if (!subs?.length) return Response.json({ enviados: 0 })

    const payload = JSON.stringify({
      title: `${emoji} ${nombreReactor} reaccionó a un registro`,
      body: `Registro del ${fechaStr} de ${nombreNino}`,
      url: `/historial`,
    })

    // ── Enviar en paralelo ───────────────────────────────────────────────
    const resultados = await Promise.allSettled(
      subs.map(({ subscription, usuario_id }) =>
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          if (err.statusCode === 410) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('usuario_id', usuario_id)
          }
          throw err
        })
      )
    )

    const enviados = resultados.filter(r => r.status === 'fulfilled').length
    return Response.json({ enviados, total: subs.length })

  } catch (err) {
    console.error('Error notificando reacción:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
