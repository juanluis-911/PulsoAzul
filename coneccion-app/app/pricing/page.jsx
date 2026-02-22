'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PLANS = [
  {
    id: 'pro_monthly',
    name: 'Pro Mensual',
    price: '$9.99',
    period: '/mes',
    description: 'Acceso completo con facturación mensual',
    features: [
      'Registros diarios ilimitados',
      'Equipo terapéutico completo',
      'Reportes y progreso',
      'Soporte prioritario',
    ],
  },
  {
    id: 'pro_annual',
    name: 'Pro Anual',
    price: '$99',
    period: '/año',
    description: 'Ahorra 17% con facturación anual',
    badge: 'Más popular',
    features: [
      'Todo lo del plan mensual',
      '2 meses gratis',
      'Acceso anticipado a nuevas funciones',
      'Soporte prioritario',
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('checkout') === 'canceled'
  const [loading, setLoading] = useState(null) // id del plan en proceso

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
        // Si no está autenticado, redirigir al login
        if (res.status === 401) {
          router.push('/auth/login?next=/pricing')
          return
        }
        throw new Error(data.error || 'Error al crear sesión de pago')
      }

      // Redirigir al checkout de Stripe
      window.location.href = data.url

    } catch (err) {
      console.error(err)
      alert('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Planes simples y transparentes
          </h1>
          <p className="text-lg text-slate-600">
            Elige el plan que mejor se adapte a tu familia
          </p>
        </div>

        {/* Aviso de cancelación */}
        {canceled && (
          <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-center">
            El proceso de pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.
          </div>
        )}

        {/* Cards de planes */}
        <div className="grid md:grid-cols-2 gap-8">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-8 shadow-sm flex flex-col ${
                plan.badge ? 'border-blue-500' : 'border-slate-200'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 mb-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-slate-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className="w-full"
                variant={plan.badge ? 'primary' : 'outline'}
              >
                {loading === plan.id ? 'Redirigiendo...' : 'Comenzar ahora'}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          Cancela cuando quieras. Sin permanencia.
        </p>
      </div>
    </div>
  )
}