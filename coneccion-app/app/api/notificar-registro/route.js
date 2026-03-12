import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  // Verificar variables de entorno
  console.log('VAPID_MAILTO:', process.env.VAPID_MAILTO)
  console.log('NEXT_PUBLIC_VAPID_KEY:', process.env.NEXT_PUBLIC_VAPID_KEY?.slice(0, 10) + '...')
  console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY?.slice(0, 10) + '...')
  console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + '...')

  // Mover setVapidDetails aquí dentro para que solo se ejecute en runtime
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  try {
    const { ninoId, nombreNino, creadoPor, urlRegistro } = await request.json()

    // Obtener todos los miembros del equipo del niño (excepto quien creó el registro)
    const { data: equipo, error: eqError } = await supabaseAdmin
      .from('equipo_terapeutico')
      .select('usuario_id')
      .eq('nino_id', ninoId)
      //.neq('usuario_id', creadoPor)

    if (eqError) throw eqError
    console.log('Equipo encontrado:', equipo)
    if (!equipo?.length) {
      console.log('Sin miembros en el equipo para notificar')
      return Response.json({ enviados: 0 })
    }

    const usuariosIds = equipo.map((m) => m.usuario_id)

    // Obtener suscripciones push de esos usuarios
    const { data: subs, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription, usuario_id')
      .in('usuario_id', usuariosIds)

    if (subError) throw subError
    console.log('Suscripciones encontradas:', subs)
    if (!subs?.length) {
      console.log('Ningún miembro tiene suscripción push activa')
      return Response.json({ enviados: 0 })
    }

    const payload = JSON.stringify({
      title: `📋 Nuevo registro - ${nombreNino}`,
      body: 'Se agregó un nuevo registro diario. ¡Tócalo para verlo!',
      url: urlRegistro || `/historial`,
    })

    // Enviar a todos en paralelo
    const resultados = await Promise.allSettled(
      subs.map(({ subscription, usuario_id }) =>
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          // Si la suscripción expiró (410), eliminarla
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

    resultados.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`Fallo envío [${i}]:`, r.reason)
      else console.log(`Envío [${i}] exitoso`)
    })

    const enviados = resultados.filter((r) => r.status === 'fulfilled').length
    console.log(`Enviados: ${enviados}/${subs.length}`)
    return Response.json({ enviados, total: subs.length })
  } catch (err) {
    console.error('Error enviando notificaciones:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}