import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No tienes una suscripción activa' },
        { status: 400 }
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })

  } catch (err) {
    console.error('[portal]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}