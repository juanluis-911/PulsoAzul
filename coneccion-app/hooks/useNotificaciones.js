'use client'
import { useEffect, useState } from 'react'
import { registrarServiceWorker, suscribirAPush } from '@/lib/notifications'

export function useNotificaciones() {
  const [estado, setEstado] = useState('idle') // idle | solicitando | activo | denegado | no-soportado

  useEffect(() => {
    if (!('Notification' in window)) {
      setEstado('no-soportado')
      return
    }
    if (Notification.permission === 'granted') setEstado('activo')
    else if (Notification.permission === 'denied') setEstado('denegado')

    registrarServiceWorker()
  }, [])

  async function activar() {
    setEstado('solicitando')
    const sub = await suscribirAPush()
    setEstado(sub ? 'activo' : 'denegado')
  }

  return { estado, activar }
}