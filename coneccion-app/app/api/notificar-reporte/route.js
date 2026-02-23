import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export async function POST(request) {
  try {
    const { usuario_id, nombreNino } = await request.json()

    // Obtener suscripciones del usuario
    const { data: subs, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription, usuario_id')
      .eq('usuario_id', usuario_id)

    if (error) throw error
    if (!subs?.length) return Response.json({ enviados: 0 })

    const payload = JSON.stringify({
      title: '📊 Ya está listo tu reporte semanal',
      body: `El progreso de ${nombreNino} de esta semana está disponible.`,
      // Texto del botón / acción
      actions: [{ action: 'descargar', title: '⬇️ Descárgalo' }],
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      url: '/progreso?reporte=1',  // Al hacer clic abre la página de progreso con flag
    })

    const resultados = await Promise.allSettled(
      subs.map(({ subscription, usuario_id: uid }) =>
        webpush.sendNotification(subscription, payload).catch(async err => {
          if (err.statusCode === 410) {
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('usuario_id', uid)
          }
          throw err
        })
      )
    )

    const enviados = resultados.filter(r => r.status === 'fulfilled').length
    return Response.json({ enviados, total: subs.length })
  } catch (err) {
    console.error('Error notificación reporte:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}