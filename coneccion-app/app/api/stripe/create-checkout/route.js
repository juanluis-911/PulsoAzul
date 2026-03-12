import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_annual:  process.env.STRIPE_PRICE_PRO_ANNUAL,
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { plan = 'pro_monthly' } = await request.json()
    const priceId = PRICES[plan]

    if (!priceId) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre_completo')
        .eq('id', user.id)
        .maybeSingle()

      const customer = await stripe.customers.create({
        email: user.email,
        name: perfil?.nombre_completo || '',
        metadata: { supabase_user_id: user.id },
      })

      customerId = customer.id

      await supabase.from('subscriptions').upsert({
        id: user.id,
        stripe_customer_id: customerId,
        status: 'incomplete',
      })
    }

    // ✅ CAMBIO: payment_method_collection: 'if_required'
    // Stripe NO pedirá tarjeta durante el trial de 30 días.
    // Al vencer el trial, Stripe enviará un email al usuario pidiéndole
    // que agregue su método de pago para continuar.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_collection: 'if_required',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?checkout=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_URL}/pricing?checkout=canceled`,
      subscription_data: {
        trial_period_days: 30,
        metadata: { supabase_user_id: user.id, plan },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })

  } catch (err) {
    console.error('[create-checkout]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}