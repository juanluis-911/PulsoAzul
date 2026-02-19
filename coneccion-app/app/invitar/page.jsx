'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Mail, UserPlus, Check } from 'lucide-react'
import Link from 'next/link'
import { ROLES, validarEmail } from '@/lib/utils'

export default function InvitarPage() {
  const [loading, setLoading] = useState(false)
  const [loadingNinos, setLoadingNinos] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [ninos, setNinos] = useState([])
  const [formData, setFormData] = useState({
    email: '',
    ninoId: '',
    rol: 'maestra_sombra',
    permisos: 'edicion',
  })

  useEffect(() => {
    fetchNinos()
  }, [])

  const fetchNinos = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Obtener niños donde el usuario es padre
    const { data } = await supabase
      .from('ninos')
      .select('*')
      .eq('padre_id', user.id)

    setNinos(data || [])
    
    if (data && data.length === 1) {
      setFormData(prev => ({ ...prev, ninoId: data[0].id }))
    }
    
    setLoadingNinos(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validar email
    if (!validarEmail(formData.email)) {
      setError('Por favor ingresa un email válido')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', formData.email)
      .single()

    // Nota: En producción, necesitarás configurar un webhook o función serverless
    // para enviar invitaciones por email usando Supabase Auth Admin API
    // Por ahora, este es un placeholder que muestra el flujo

    // Agregar al equipo (si el usuario ya existe)
    // En producción, esto se haría después de que el usuario acepte la invitación

    const { data: { user } } = await supabase.auth.getUser()

    // Por ahora, solo mostrar un mensaje de éxito
    // En producción real, aquí enviarías el email de invitación
    setSuccess(`Invitación enviada a ${formData.email}. Una vez que acepte, será agregado al equipo.`)
    
    // Limpiar formulario
    setFormData({
      email: '',
      ninoId: formData.ninoId,
      rol: 'maestra_sombra',
      permisos: 'edicion',
    })

    setLoading(false)
  }

  if (loadingNinos) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Cargando...</p>
      </div>
    )
  }

  if (ninos.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                No hay niños registrados
              </h2>
              <p className="text-slate-600 mb-6">
                Primero necesitas agregar el perfil de un niño para poder invitar a su equipo terapéutico
              </p>
              <Link href="/nino/nuevo">
                <Button>Agregar niño</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Invitar al equipo terapéutico</CardTitle>
            <CardDescription>
              Agrega maestras sombra y terapeutas para que puedan ver y registrar el progreso del niño
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                name="ninoId"
                label="¿Para qué niño?"
                value={formData.ninoId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar...</option>
                {ninos.map((nino) => (
                  <option key={nino.id} value={nino.id}>
                    {nino.nombre} {nino.apellido}
                  </option>
                ))}
              </Select>

              <Input
                type="email"
                name="email"
                label="Email de la persona a invitar"
                placeholder="maestra@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                helperText="Enviaremos una invitación a este correo"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  name="rol"
                  label="Rol"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                >
                  <option value="maestra_sombra">Maestra Sombra</option>
                  <option value="terapeuta">Terapeuta</option>
                </Select>

                <Select
                  name="permisos"
                  label="Permisos"
                  value={formData.permisos}
                  onChange={handleChange}
                  required
                >
                  <option value="lectura">Solo lectura</option>
                  <option value="edicion">Lectura y edición</option>
                </Select>
              </div>

              {/* Info sobre permisos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-900 mb-1">Sobre los permisos:</p>
                <ul className="text-blue-700 space-y-1 list-disc list-inside">
                  <li><strong>Solo lectura:</strong> Puede ver registros y progreso</li>
                  <li><strong>Lectura y edición:</strong> Puede ver y crear nuevos registros</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{success}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Link href="/dashboard">
                  <Button variant="ghost" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Mail className="w-4 h-4 mr-2" />
                  {loading ? 'Enviando invitación...' : 'Enviar invitación'}
                </Button>
              </div>
            </form>

            {/* Nota de desarrollo */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 italic">
                <strong>Nota de desarrollo:</strong> En producción, aquí se implementará el envío real de invitaciones por email usando Supabase Auth Admin API. 
                Los usuarios invitados recibirán un email para crear su cuenta y serán automáticamente agregados al equipo del niño.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
