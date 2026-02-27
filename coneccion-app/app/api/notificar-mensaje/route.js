import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request) {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  try {
    const { mensajeId, ninoId, autorId, nombreNino, nombreAutor, preview } = await request.json()

    // ── Esperar 10 segundos ───────────────────────────────────────────────
    await delay(10000)

    // ── Verificar que el mensaje sigue existiendo ─────────────────────────
    const { data: mensaje, error: msgError } = await supabaseAdmin
      .from('mensajes')
      .select('id, leido_por')
      .eq('id', mensajeId)
      .maybeSingle()

    if (msgError || !mensaje) {
      console.log('Mensaje no encontrado (fue borrado?), cancelando notificación')
      return Response.json({ enviados: 0, motivo: 'mensaje_no_encontrado' })
    }

    // ── Obtener equipo del niño (excluyendo al autor) ─────────────────────
    const [{ data: equipoData }, { data: ninoData }] = await Promise.all([
      supabaseAdmin
        .from('equipo_terapeutico')
        .select('usuario_id')
        .eq('nino_id', ninoId)
        .neq('usuario_id', autorId),
      supabaseAdmin
        .from('ninos')
        .select('padre_id')
        .eq('id', ninoId)
        .maybeSingle(),
    ])

    // Incluir al padre si no es el autor
    const destinatarioIds = [
      ...new Set([
        ...(equipoData ?? []).map(m => m.usuario_id),
        ...(ninoData?.padre_id && ninoData.padre_id !== autorId ? [ninoData.padre_id] : []),
      ])
    ]

    if (!destinatarioIds.length) {
      console.log('Sin destinatarios, cancelando')
      return Response.json({ enviados: 0, motivo: 'sin_destinatarios' })
    }

    // ── Filtrar los que YA leyeron el mensaje ─────────────────────────────
    const leidoPor = mensaje.leido_por ?? []
    const noLeyeron = destinatarioIds.filter(id => !leidoPor.includes(id))

    if (!noLeyeron.length) {
      console.log('Todos ya leyeron el mensaje, no se envía notificación')
      return Response.json({ enviados: 0, motivo: 'todos_leyeron' })
    }

    // ── Obtener suscripciones push de quienes no leyeron ──────────────────
    const { data: subs, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription, usuario_id')
      .in('usuario_id', noLeyeron)

    if (subError) throw subError
    if (!subs?.length) {
      console.log('Ningún destinatario tiene suscripción push activa')
      return Response.json({ enviados: 0, motivo: 'sin_suscripciones' })
    }

    // ── Construir payload de la notificación ──────────────────────────────
    const textoPreview = preview?.length > 60 ? preview.slice(0, 60) + '…' : (preview ?? '')
    const payload = JSON.stringify({
      title: `💬 ${nombreNino} — nuevo mensaje`,
      body: textoPreview
        ? `${nombreAutor}: ${textoPreview}`
        : `${nombreAutor} envió un mensaje`,
      icon:  '/icon-192x192.png',
      badge: '/badge-72x72.png',
      url:   `/mensajes/${ninoId}`,
    })

    // ── Enviar a todos en paralelo ────────────────────────────────────────
    const resultados = await Promise.allSettled(
      subs.map(({ subscription, usuario_id }) =>
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          if (err.statusCode === 410) {
            // Suscripción expirada — eliminar
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('usuario_id', usuario_id)
          }
          throw err
        })
      )
    )

    resultados.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`Fallo push [${i}]:`, r.reason?.message)
      else console.log(`Push [${i}] enviado OK`)
    })

    const enviados = resultados.filter(r => r.status === 'fulfilled').length
    console.log(`Notificaciones enviadas: ${enviados}/${subs.length}`)
    return Response.json({ enviados, total: subs.length })

  } catch (err) {
    console.error('Error en notificar-mensaje:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}