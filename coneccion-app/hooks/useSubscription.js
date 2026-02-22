'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook para acceder al estado de suscripción del usuario actual.
 *
 * Uso:
 *   const { subscription, loading, isActive, openPortal } = useSubscription()
 *
 * Retorna:
 *   - subscription: objeto completo de la tabla subscriptions (o null)
 *   - loading: boolean
 *   - isActive: true si status === 'active' o 'trialing' (y período no vencido si cancel_at_period_end)
 *   - openPortal: función async que redirige al Stripe Customer Portal
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading]           = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let channel

    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      setSubscription(data)
      setLoading(false)

      // Escuchar cambios en tiempo real (ej: webhook actualiza el status)
      channel = supabase
        .channel('subscription_changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'subscriptions', filter: `id=eq.${user.id}` },
          (payload) => setSubscription(payload.new)
        )
        .subscribe()
    }

    fetchSubscription()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  // Determinar si el usuario tiene acceso activo
  const isActive = (() => {
    if (!subscription) return false
    if (subscription.status === 'active' || subscription.status === 'trialing') return true

    // Canceló pero el período pagado aún no venció
    if (subscription.cancel_at_period_end && subscription.current_period_end) {
      return new Date(subscription.current_period_end) > new Date()
    }

    return false
  })()

  const openPortal = useCallback(async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else console.error('[openPortal]', data.error)
  }, [])

  return { subscription, loading, isActive, openPortal }
}