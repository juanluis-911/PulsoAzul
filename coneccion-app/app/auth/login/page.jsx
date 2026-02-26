'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import NextImage from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const processAuthCallback = async () => {
      const hash = window.location.hash
      console.log('URL actual:', window.location.href)
      console.log('Hash:', hash)

      // Si no hay hash con token, mostrar el formulario normalmente
      if (!hash || !hash.includes('access_token')) {
        console.log('No hay token en la URL')
        setInitialLoading(false)
        return
      }

      console.log('Token detectado, procesando...')
      const hashParams = new URLSearchParams(hash.substring(1))
      const type         = hashParams.get('type')
      const accessToken  = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token') || ''

      // Recovery → redirigir a reset-password
      if (type === 'recovery') {
        router.push('/auth/reset-password' + hash)
        return
      }

      try {
        // ✅ Siempre establecer la sesión con los tokens del hash
        // (no usar getSession primero, ya que puede no tener la sesión del invite aún)
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) throw sessionError

        if (!data.session) {
          setError('No se pudo establecer la sesión. El enlace puede haber expirado.')
          setInitialLoading(false)
          return
        }

        console.log('Sesión establecida:', data.session.user.email)

        // ✅ Si es invitación, pasar ?invited=true para que complete-profile
        // sepa que debe pedir contraseña
        if (type === 'invite') {
          router.push('/auth/complete-profile?invited=true')
          return
        }

        // Para magic link u otros tipos, verificar si el perfil ya está completo
        const { data: profile } = await supabase
          .from('perfiles')
          .select('nombre_completo, rol_principal')
          .eq('id', data.session.user.id)
          .maybeSingle()

        if (profile?.nombre_completo && profile?.rol_principal) {
          router.push('/dashboard')
        } else {
          router.push('/auth/complete-profile')
        }

      } catch (err) {
        console.error('Error procesando autenticación:', err)
        setError('Error al procesar la autenticación: ' + err.message)
        setInitialLoading(false)
      }
    }

    processAuthCallback()
  }, []) // ✅ Sin dependencias — solo corre al montar

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Verificar perfil después del login normal
    try {
      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre_completo, rol_principal')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profile?.nombre_completo && profile?.rol_principal) {
        router.push('/dashboard')
      } else {
        router.push('/auth/complete-profile')
      }
      router.refresh()
    } catch (err) {
      console.error('Error verificando perfil:', err)
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Procesando autenticación...</p>
          <p className="text-sm text-slate-400 mt-2">Por favor espera</p>
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
            <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
            <p className="text-slate-600 mt-2">Bienvenido de vuelta</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Correo electrónico"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-slate-600">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/registro" className="text-primary-600 hover:text-primary-700 font-medium">
                Regístrate gratis
              </Link>
            </p>
            <p className="text-sm">
              <Link href="/auth/recuperar-password" className="text-slate-500 hover:text-slate-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}