'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CompleteProfile() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Verificar si ya tiene perfil completo
      const { data: profile } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.nombre_completo && profile?.rol_principal) {
        // Si ya tiene perfil completo, redirigir al dashboard
        router.push('/dashboard')
      } else {
        setUser(user)
      }
    } else {
      router.push('/auth/login')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const formData = new FormData(e.target)
    const profileData = {
      id: user.id,
      nombre_completo: formData.get('nombre_completo'),
      telefono: formData.get('telefono'),
      rol_principal: formData.get('rol_principal')
    }

    try {
      // Crear o actualizar el perfil del usuario
      const { error } = await supabase
        .from('perfiles')
        .upsert(profileData)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Perfil completado exitosamente' 
      })

      // Redirigir al dashboard después de 1 segundo
      setTimeout(() => {
        router.push('/dashboard?welcome=true')
      }, 1000)

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al guardar el perfil: ' + error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Completa tu perfil
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bienvenido a Pulso Azul. Por favor completa tu información para continuar
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={user.email}
                disabled
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                id="nombre_completo"
                name="nombre_completo"
                type="text"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: +52 123 456 7890"
              />
            </div>

            <div>
              <label htmlFor="rol_principal" className="block text-sm font-medium text-gray-700">
                Rol principal
              </label>
              <select
                id="rol_principal"
                name="rol_principal"
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Selecciona un rol</option>
                <option value="padre">Padre/Madre</option>
                <option value="maestra_sombra">Maestra Sombra</option>
                <option value="terapeuta">Terapeuta</option>
              </select>
            </div>
          </div>

          {message.text && (
            <div className={`text-sm text-center p-2 rounded ${
              message.type === 'error' 
                ? 'text-red-700 bg-red-100' 
                : 'text-green-700 bg-green-100'
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Completar registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}