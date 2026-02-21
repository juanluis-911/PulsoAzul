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
      console.log('URL actual:', window.location.href)
      console.log('Hash:', window.location.hash)

      // Verificar si hay un fragmento con token
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('Token detectado, procesando...')
        
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        if (hashParams.get('type') === 'recovery') {
          router.push('/auth/reset-password' + window.location.hash)
          return
        }
        try {
          // Método 1: Intentar con getSession (más confiable)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Error getSession:', sessionError)
            throw sessionError
          }
          
          if (session) {
            console.log('Sesión establecida:', session.user.email)
            
            // Verificar perfil
            const { data: profile, error: profileError } = await supabase
              .from('perfiles')
              .select('nombre_completo, rol_principal')
              .eq('id', session.user.id)
              .maybeSingle()

            if (profileError) {
              console.error('Error verificando perfil:', profileError)
            }

            // Redirigir según el perfil
            if (profile?.nombre_completo && profile?.rol_principal) {
              router.push('/dashboard')
            } else {
              router.push('/auth/complete-profile')
            }
            return
          }

          // Si no hay sesión, intentar método alternativo
          console.log('No hay sesión, intentando método alternativo...')
          
          // Extraer tokens del hash manualmente
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1) // Quitar el #
          )
          
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken) {
            console.log('Tokens encontrados en hash, estableciendo sesión...')
            
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error) throw error
            
            if (data.session) {
              // Verificar perfil
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
              return
            }
          }
          
          // Si llegamos aquí, algo salió mal
          setError('No se pudo procesar la autenticación automática')
        } catch (error) {
          console.error('Error procesando autenticación:', error)
          setError('Error al procesar la autenticación: ' + error.message)
        } finally {
          setInitialLoading(false)
        }
      } else {
        console.log('No hay token en la URL')
        setInitialLoading(false)
      }
    }

    processAuthCallback()
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
        .maybeSingle()

      if (profile?.nombre_completo && profile?.rol_principal) {
        router.push('/dashboard')
      } else {
        router.push('/auth/complete-profile')
      }
      router.refresh()
    } catch (error) {
      console.error('Error verificando perfil:', error)
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