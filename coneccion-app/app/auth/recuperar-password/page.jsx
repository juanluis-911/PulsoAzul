'use client'

import { useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const [expirado, setExpirado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setExpirado(true)  
    } else {
      setEnviado(true)
    }

    setLoading(false)
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
            <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
            <p className="text-slate-600 mt-2">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Correo enviado</h2>
              <p className="text-slate-600 text-sm">
                Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue el enlace para restablecer tu contraseña.
              </p>
              <p className="text-xs text-slate-400">
                Si no lo ves, revisa tu carpeta de spam.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full mt-2">
                  Volver al inicio de sesión
                </Button>
              </Link>
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
                  type="email"
                  label="Correo electrónico"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-sm text-slate-500 hover:text-slate-700">
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}