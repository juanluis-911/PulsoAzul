'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const LABELS_ROL = {
  padre: 'Padre/Madre',
  maestra_sombra: 'Maestra Sombra',
  terapeuta: 'Terapeuta',
}

export default function CompleteProfile() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [user, setUser] = useState(null)
  const [rolAsignado, setRolAsignado] = useState('')
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    // ✅ .maybeSingle() no lanza error si no existe el perfil
    const { data: profile } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.nombre_completo && profile?.rol_principal) {
      router.push('/dashboard')
      return
    }

    setUser(user)

    // ✅ El rol viene en los metadatos de la invitación
    const rolFromMeta = user.user_metadata?.rol || user.user_metadata?.rol_principal || ''
    setRolAsignado(rolFromMeta)
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setMessage({ type: '', text: '' })

  const formData = new FormData(e.target)

  const profileData = {
    nombre_completo: formData.get('nombre_completo'),
    telefono: formData.get('telefono'),
    rol_principal: rolAsignado || formData.get('rol_principal'),
  }

  try {
    // ✅ UPDATE en lugar de upsert — el trigger ya creó el registro al registrarse
    const { error } = await supabase
      .from('perfiles')
      .update(profileData)
      .eq('id', user.id)

    if (error) {
      // Si falla el update (registro no existe), intentar insert como fallback
      const { error: insertError } = await supabase
        .from('perfiles')
        .insert({ id: user.id, ...profileData })

      if (insertError) throw insertError
    }

    // Actualizar también user_metadata para consistencia
    await supabase.auth.updateUser({
      data: { nombre_completo: profileData.nombre_completo }
    })

    setMessage({ type: 'success', text: 'Perfil completado exitosamente' })
    setTimeout(() => router.push('/dashboard?welcome=true'), 1000)

  } catch (error) {
    setMessage({ type: 'error', text: 'Error al guardar el perfil: ' + error.message })
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
            Bienvenido a Pulso Azul. Por favor completa tu información para continuar.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: +52 123 456 7890"
              />
            </div>

            {/* ✅ Rol: si viene de invitación se muestra fijo, si no se elige */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              {rolAsignado ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="block w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-100 text-gray-700">
                    {LABELS_ROL[rolAsignado] || rolAsignado}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">Asignado por invitación</span>
                </div>
              ) : (
                <select
                  id="rol_principal"
                  name="rol_principal"
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un rol</option>
                  <option value="padre">Padre/Madre</option>
                  <option value="maestra_sombra">Maestra Sombra</option>
                  <option value="terapeuta">Terapeuta</option>
                </select>
              )}
            </div>

          </div>

          {message.text && (
            <div className={`text-sm text-center p-2 rounded ${
              message.type === 'error' ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Completar registro'}
          </button>
        </form>
      </div>
    </div>
  )
}