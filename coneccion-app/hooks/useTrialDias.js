'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TRIAL_DIAS = 30

/**
 * Hook que retorna los días restantes del trial gratuito.
 *
 * Retorna:
 *   - diasRestantes: número (0 a 30), null si ya tiene suscripción paga
 *   - enTrial: true si está en el período de prueba sin suscripción Stripe
 *   - trialeVencido: true si el trial de 30 días ya pasó sin pagar
 *   - loading: boolean
 */
export function useTrialDias() {
  const [diasRestantes, setDiasRestantes] = useState(null)
  const [enTrial, setEnTrial]             = useState(false)
  const [trialVencido, setTrialVencido]   = useState(false)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Verificar si tiene suscripción Stripe activa
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('id', user.id)
        .maybeSingle()

      // Si tiene suscripción activa/trialing en Stripe → no está en free trial
      if (sub?.status === 'active' || sub?.status === 'trialing') {
        setEnTrial(false)
        setLoading(false)
        return
      }

      // Calcular días desde el registro
      const createdAt = new Date(user.created_at)
      const now = new Date()
      const diasTranscurridos = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))
      const restantes = Math.max(0, TRIAL_DIAS - diasTranscurridos)

      setEnTrial(true)
      setDiasRestantes(restantes)
      setTrialVencido(restantes === 0)
      setLoading(false)
    }

    check()
  }, [])

  return { diasRestantes, enTrial, trialVencido, loading }
}