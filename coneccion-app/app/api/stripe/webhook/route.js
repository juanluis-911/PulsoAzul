import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Cliente admin: bypasea RLS para poder escribir en subscriptions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// App Router: deshabilitar body parsing para que Stripe pueda verificar la firma
export const dynamic = 'force-dynamic'

export async function POST(request) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Firma inválida:', err.message)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── 1. Checkout completado → activar suscripción ─────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription') break

        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const userId = subscription.metadata?.supabase_user_id
        const plan   = subscription.metadata?.plan || 'pro_monthly'

        if (!userId) {
          console.error('[webhook] checkout.session.completed: sin supabase_user_id')
          break
        }

        await supabaseAdmin.from('subscriptions').upsert({
          id:                    userId,
          stripe_customer_id:    session.customer,
          stripe_subscription_id: subscription.id,
          status:                'active',
          plan,
          current_period_end:    new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end:  subscription.cancel_at_period_end,
        })
        break
      }

      // ── 2. Pago de factura exitoso → renovar período ─────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        if (!invoice.subscription) break

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

        // El userId puede venir de la subscription o del invoice (fallback)
        const userId =
          subscription.metadata?.supabase_user_id ||
          invoice.parent?.subscription_details?.metadata?.supabase_user_id ||
          invoice.subscription_details?.metadata?.supabase_user_id

        if (!userId) {
          console.error('[webhook] invoice.payment_succeeded: sin supabase_user_id')
          break
        }

        const plan =
          subscription.metadata?.plan ||
          invoice.parent?.subscription_details?.metadata?.plan ||
          'pro_monthly'

        // upsert en lugar de update: crea la fila si no existe todavía
        await supabaseAdmin.from('subscriptions').upsert({
          id:                     userId,
          stripe_customer_id:     invoice.customer,
          stripe_subscription_id: invoice.subscription,
          status:                 'active',
          plan,
          current_period_end:     new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end:   subscription.cancel_at_period_end,
        })
        break
      }

      // ── 3. Pago fallido → marcar como past_due ────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (!invoice.subscription) break

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId =
          subscription.metadata?.supabase_user_id ||
          invoice.parent?.subscription_details?.metadata?.supabase_user_id

        if (!userId) {
          console.error('[webhook] invoice.payment_failed: sin supabase_user_id')
          break
        }

        await supabaseAdmin.from('subscriptions').upsert({
          id:                     userId,
          stripe_customer_id:     invoice.customer,
          stripe_subscription_id: invoice.subscription,
          status:                 'past_due',
        })
        break
      }

      // ── 4. Suscripción eliminada → cancelar acceso ────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.supabase_user_id

        if (!userId) break

        await supabaseAdmin.from('subscriptions').update({
          status:               'canceled',
          cancel_at_period_end: false,
        }).eq('id', userId)
        break
      }

      // ── 5. Suscripción actualizada → cambio de plan / cancelación ─────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata?.supabase_user_id

        if (!userId) break

        // Mapear status de Stripe a nuestro status interno
        const statusMap = {
          active:   'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid:   'past_due',
          incomplete: 'incomplete',
          incomplete_expired: 'canceled',
        }

        const plan = subscription.metadata?.plan || 'pro_monthly'

        await supabaseAdmin.from('subscriptions').update({
          status:               statusMap[subscription.status] ?? 'past_due',
          plan,
          current_period_end:   new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('id', userId)
        break
      }

      default:
        // Ignorar eventos no manejados
        break
    }
  } catch (err) {
    console.error(`[webhook] Error procesando ${event.type}:`, err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}