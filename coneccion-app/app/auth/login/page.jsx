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

  // Efecto para procesar tokens de invitación en el fragmento de la URL
  useEffect(() => {
    const handleInviteToken = async () => {
      // Verificar si hay un fragmento con token en la URL
      if (window.location.hash && window.location.hash.includes('access_token')) {
        try {
          setInitialLoading(true)
          
          // Supabase puede procesar automáticamente el fragmento
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) throw error
          
          if (session) {
            // Verificar si el perfil está completo
            const { data: profile, error: profileError } = await supabase
              .from('perfiles')
              .select('nombre_completo, rol_principal')
              .eq('id', session.user.id)
              .single()

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error verificando perfil:', profileError)
            }

            // Redirigir según el estado del perfil
            if (profile?.nombre_completo && profile?.rol_principal) {
              router.push('/dashboard')
            } else {
              router.push('/auth/complete-profile')
            }
          }
        } catch (error) {
          console.error('Error procesando autenticación:', error)
          setError('Error al procesar la autenticación. Por favor intenta de nuevo.')
        } finally {
          setInitialLoading(false)
        }
      } else {
        setInitialLoading(false)
      }
    }

    handleInviteToken()
  }, [router, supabase])

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

    // Verificar perfil después del login
    try {
      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre_completo, rol_principal')
        .eq('id', data.user.id)
        .single()

      if (profile?.nombre_completo && profile?.rol_principal) {
        router.push('/dashboard')
      } else {
        router.push('/auth/complete-profile')
      }
      router.refresh()
    } catch (error) {
      console.error('Error verificando perfil:', error)
      router.push('/dashboard') // Redirigir al dashboard si hay error
      router.refresh()
    }
  }

  // Mostrar carga inicial mientras procesamos el token
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Procesando autenticación...</p>
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || initialLoading}
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