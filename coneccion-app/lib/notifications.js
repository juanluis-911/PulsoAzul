import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    console.log('SW registrado:', reg.scope)
    return reg
  } catch (err) {
    console.error('Error registrando SW:', err)
    return false
  }
}

export async function suscribirAPush() {
  try {
    const reg = await navigator.serviceWorker.ready
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_KEY),
    })

    // Obtener el usuario autenticado para incluir usuario_id explícitamente
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Usuario no autenticado')

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { usuario_id: user.id, subscription: sub.toJSON() },
        { onConflict: 'usuario_id' }
      )

    if (error) throw error
    console.log('Suscripción push guardada ✅')
    return sub
  } catch (err) {
    console.error('Error suscribiendo push:', err)
    return null
  }
}

export async function cancelarSuscripcion() {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    await supabase.from('push_subscriptions').delete().neq('id', '')
  } catch (err) {
    console.error('Error cancelando suscripción:', err)
  }
}

// Helper
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}