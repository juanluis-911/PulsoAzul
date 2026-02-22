'use client'

import { useEffect, useState } from 'react'

/**
 * Verifica si el padre del niño tiene suscripción activa.
 * Maestros y terapeutas lo usan para saber si pueden agregar registros.
 *
 * @param {string|null} ninoId - UUID del niño seleccionado
 */
export function usePadreSubscription(ninoId) {
  const [padreHaPagado, setPadreHaPagado] = useState(null) // null = cargando
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ninoId) {
      setPadreHaPagado(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/check-padre-subscription?ninoId=${ninoId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.error) throw new Error(data.error)
        setPadreHaPagado(data.padreHaPagado)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [ninoId])

  return { padreHaPagado, loading, error }
}