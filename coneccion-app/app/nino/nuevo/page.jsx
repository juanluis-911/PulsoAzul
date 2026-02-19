'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoNinoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    diagnostico: '',
    notasAdicionales: '',
  })

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

    const supabase = createClient()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('No se pudo verificar tu sesión')
      setLoading(false)
      return
    }

    // Insertar el niño
    const { data, error } = await supabase
      .from('ninos')
      .insert([
        {
          nombre: formData.nombre,
          apellido: formData.apellido,
          fecha_nacimiento: formData.fechaNacimiento,
          diagnostico: formData.diagnostico,
          notas_adicionales: formData.notasAdicionales,
          padre_id: user.id,
        }
      ])
      .select()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Redirigir al dashboard
    router.push('/dashboard')
    router.refresh()
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
            <CardTitle>Agregar niño</CardTitle>
            <CardDescription>
              Crea el perfil de tu hijo para comenzar a llevar registro de su progreso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="nombre"
                  label="Nombre"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />

                <Input
                  type="text"
                  name="apellido"
                  label="Apellido"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                type="date"
                name="fechaNacimiento"
                label="Fecha de nacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                required
              />

              <Input
                type="text"
                name="diagnostico"
                label="Diagnóstico (opcional)"
                placeholder="Ej: TEA, TDAH, etc."
                value={formData.diagnostico}
                onChange={handleChange}
              />

              <Textarea
                name="notasAdicionales"
                label="Notas adicionales (opcional)"
                placeholder="Información relevante para el equipo terapéutico..."
                value={formData.notasAdicionales}
                onChange={handleChange}
                rows={4}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Link href="/dashboard">
                  <Button variant="ghost" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar perfil'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
