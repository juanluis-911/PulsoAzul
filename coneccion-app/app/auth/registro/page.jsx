'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import NextImage from 'next/image'

export default function RegistroPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nombre_completo: formData.nombreCompleto,
          rol: 'padre',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // ✅ CAMBIO: Trial sin tarjeta — va directo al dashboard
    // El middleware permitirá el acceso con status 'free_trial'
    router.push('/dashboard?welcome=true')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <NextImage
                src="/pulsoAzulLogo.png"
                alt="Pulso Azul"
                width={120}
                height={40}
                className="object-contain"
              />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-4">Crear cuenta</h1>
            <p className="text-slate-600 mt-2">
              30 días gratis · Sin tarjeta de crédito
            </p>
          </div>

          {/* Badge trial */}
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <span className="text-lg">🎁</span>
            <div>
              <p className="text-sm font-semibold text-green-800">30 días completamente gratis</p>
              <p className="text-xs text-green-600">No pedimos tarjeta. Empieza a usar la app hoy mismo.</p>
            </div>
          </div>

          <form onSubmit={handleRegistro} className="space-y-4">
            <Input
              type="text"
              name="nombreCompleto"
              placeholder="Nombre completo"
              value={formData.nombreCompleto}
              onChange={handleChange}
              required
            />
            <Input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Contraseña (mín. 6 caracteres)"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm
                         hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Comenzar gratis →'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}