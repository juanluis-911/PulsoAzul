'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState('')
  const [sesionLista, setSesionLista] = useState(false)
  const [enlaceExpirado, setEnlaceExpirado] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      // 🔴 CORRECCIÓN: Supabase usa 'token' en lugar de 'code' para PKCE
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      const type = params.get('type')

      console.log('Parámetros de URL:', { token, type }) // Para debugging

      if (token && type === 'recovery') {
        // 🔴 CORRECCIÓN: Para PKCE necesitas intercambiar el token por sesión
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        })

        if (error) {
          console.error('Error verificando token:', error)
          setEnlaceExpirado(true)
          return
        }
        
        // Verificar que la sesión se estableció correctamente
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSesionLista(true)
        } else {
          setEnlaceExpirado(true)
        }
        return
      }

      // Fallback: Si no hay token en query params, revisar hash (flujo legacy)
      if (window.location.hash?.includes('access_token')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        if (hashParams.get('type') === 'recovery') {
          setSesionLista(true)
          return
        }
      }

      // Si no hay ningún método válido, el enlace es inválido
      setEnlaceExpirado(true)
    }

    init()
  }, [supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('No se pudo actualizar la contraseña: ' + error.message)
    } else {
      setListo(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }

    setLoading(false)
  }

  // El resto del JSX se mantiene igual...
  if (enlaceExpirado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Enlace inválido o expirado</h2>
            <p className="text-slate-600 text-sm">
              Este enlace ya fue usado o ha expirado. Solicita uno nuevo para restablecer tu contraseña.
            </p>
            <Link href="/auth/recuperar-password">
              <Button className="w-full">
                Solicitar nuevo enlace
              </Button>
            </Link>
            <Link href="/auth/login" className="block text-sm text-slate-500 hover:text-slate-700">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!sesionLista) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando enlace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">

          <div className="text-center mb-8">
            <Link href="/" className="inline-flex justify-center mb-4">
              <NextImage
                src="/pulsoAzulLogo.png"
                alt="Pulso Azul"
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Nueva contraseña</h1>
            <p className="text-slate-600 mt-2">Elige una contraseña segura para tu cuenta</p>
          </div>

          {listo ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">¡Contraseña actualizada!</h2>
              <p className="text-slate-600 text-sm">
                Tu contraseña fue cambiada exitosamente. Redirigiendo al dashboard...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="password"
                  label="Nueva contraseña"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />

                <Input
                  type="password"
                  label="Confirmar contraseña"
                  placeholder="Repite la contraseña"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  disabled={loading}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                </Button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}