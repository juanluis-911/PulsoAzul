'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Tag, Copy, CheckCheck, Zap, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PLANS = [
  {
    id: 'pro_monthly',
    name: 'Mensual',
    price: 99,
    period: '/mes',
    description: 'Ideal para comenzar',
    features: [
      'Registros diarios ilimitados',
      'Equipo terapéutico completo',
      'Reportes y seguimiento de progreso',
      'Soporte prioritario',
      'Acceso desde cualquier dispositivo',
    ],
    coupon: 'PULSOAZUL26',
    couponLabel: '50% OFF primer mes',
    color: 'blue',
  },
  {
    id: 'pro_annual',
    name: 'Anual',
    price: 899,
    period: '/año',
    pricePerMonth: 75,
    description: 'El favorito de las familias',
    badge: '🌟 Más popular',
    features: [
      'Todo lo del plan mensual',
      'Equivale a $75/mes — ahorra 24%',
      'Acceso anticipado a nuevas funciones (próximamente: análisis con IA 🤖)',
      'Soporte prioritario VIP',
      'Historial completo sin límites',
    ],
    coupon: 'PULSOANUAL2026',
    couponLabel: '50% OFF primer año',
    color: 'indigo',
  },
]

const PERKS = [
  { icon: Shield, label: 'Pago 100% seguro' },
  { icon: Clock, label: 'Cancela cuando quieras' },
  { icon: Zap, label: 'Acceso inmediato' },
]

function CouponBadge({ coupon, label }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(coupon)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
        <Tag className="w-3 h-3" /> Cupón exclusivo — {label}
      </p>
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-50 transition-colors group"
      >
        <span className="font-mono font-bold text-amber-800 tracking-widest text-sm">
          {coupon}
        </span>
        <span className="flex items-center gap-1 text-xs text-amber-600 group-hover:text-amber-800 transition-colors">
          {copied
            ? <><CheckCheck className="w-4 h-4 text-green-600" /><span className="text-green-600">¡Copiado!</span></>
            : <><Copy className="w-4 h-4" /> Copiar</>
          }
        </span>
      </button>
      <p className="text-xs text-amber-600 mt-1.5 text-center">
        Aplica el cupón en el checkout de Stripe ✓
      </p>
    </div>
  )
}

function CanceledBanner() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('checkout') === 'canceled'
  const reason = searchParams.get('reason')

  if (!canceled && !reason) return null

  const msg = reason === 'payment_failed'
    ? 'Hubo un problema con tu pago. Por favor intenta de nuevo.'
    : reason === 'no_subscription'
    ? 'Necesitas un plan activo para acceder al dashboard.'
    : 'El proceso de pago fue cancelado. Puedes intentarlo cuando quieras.'

  return (
    <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-center text-sm">
      {msg}
    </div>
  )
}

function PricingContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(null)

  async function handleSubscribe(planId) {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login?next=/pricing')
          return
        }
        throw new Error(data.error || 'Error al crear sesión de pago')
      }

      window.location.href = data.url
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-4">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
            🎉 Oferta de lanzamiento — 50% OFF
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Cada avance de tu hijo<br />
            <span className="text-blue-600">merece ser recordado</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Pulso Azul te ayuda a llevar un seguimiento claro y amoroso del desarrollo de tu hijo neurodivergente — para que ningún logro, por pequeño que sea, se pierda.
          </p>
        </div>

        {/* Perks */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 mt-8">
          {PERKS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-slate-500 text-sm">
              <Icon className="w-4 h-4 text-blue-500" />
              {label}
            </div>
          ))}
        </div>

        <Suspense fallback={null}>
          <CanceledBanner />
        </Suspense>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map(plan => {
            const isPopular = !!plan.badge
            const discountedPrice = plan.price * 0.5

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-200 ${
                  isPopular
                    ? 'bg-white border-2 border-blue-500 shadow-xl shadow-blue-100 scale-[1.02]'
                    : 'bg-white border border-slate-200 shadow-md hover:shadow-lg'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan name & desc */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                {/* Precio con descuento */}
                <div className="mb-6">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-slate-400 line-through text-xl">${plan.price}</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      50% OFF
                    </span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-slate-900">
                      ${discountedPrice.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-slate-400 mb-2 text-sm">{plan.period} (primera vez)</span>
                  </div>
                  {plan.pricePerMonth && (
                    <p className="text-xs text-slate-400 mt-1">
                      Luego ${plan.price}/año · equivale a ${plan.pricePerMonth}/mes
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-slate-600 text-sm">
                      <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        isPopular ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        <Check className={`w-3 h-3 ${isPopular ? 'text-blue-600' : 'text-slate-500'}`} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Coupon */}
                <CouponBadge coupon={plan.coupon} label={plan.couponLabel} />

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className={`mt-5 w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 ${
                    isPopular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  {loading === plan.id
                    ? 'Redirigiendo...'
                    : 'Comenzar ahora →'}
                </button>

                {isPopular && (
                  <p className="text-center text-xs text-blue-400 mt-3">
                    ✓ La opción más elegida por familias
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-400 text-xs mt-10">
          Al suscribirte aceptas nuestros Términos de Servicio. Cancela en cualquier momento sin penalización.
        </p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return <PricingContent />
}