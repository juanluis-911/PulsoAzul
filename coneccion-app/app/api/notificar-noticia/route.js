import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  try {
    const { noticiaId, titulo } = await request.json()

    // Obtener TODAS las suscripciones push activas
    const { data: subs, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription, usuario_id')

    if (subError) throw subError
    if (!subs?.length) {
      return Response.json({ enviados: 0 })
    }

    const payload = JSON.stringify({
      title: '📰 Noticia del día',
      body: titulo,
      url: `/noticias/${noticiaId}`,
    })

    const resultados = await Promise.allSettled(
      subs.map(({ subscription, usuario_id }) =>
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          if (err.statusCode === 410) {
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('usuario_id', usuario_id)
          }
          throw err
        })
      )
    )

    const enviados = resultados.filter((r) => r.status === 'fulfilled').length
    console.log(`Noticia enviada a: ${enviados}/${subs.length}`)
    return Response.json({ enviados, total: subs.length })
  } catch (err) {
    console.error('Error enviando notificaciones de noticia:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
