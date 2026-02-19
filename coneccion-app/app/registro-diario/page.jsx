'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ESTADOS_ANIMO } from '@/lib/utils'

export default function RegistroDiarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingNinos, setLoadingNinos] = useState(true)
  const [error, setError] = useState('')
  const [ninos, setNinos] = useState([])
  const [formData, setFormData] = useState({
    ninoId: '',
    fecha: new Date().toISOString().split('T')[0],
    estadoAnimo: '',
    actividades: '',
    logros: '',
    desafios: '',
    notas: '',
    tipoRegistro: 'escuela',
  })

  useEffect(() => {
    fetchNinos()
  }, [])

  const fetchNinos = async () => {
    const supabase = createClient()
    
    // Obtener niños del usuario actual o del equipo
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Primero intentar obtener niños como padre
    let { data: ninosPadre } = await supabase
      .from('ninos')
      .select('*')
      .eq('padre_id', user.id)

    // Luego obtener niños donde el usuario es parte del equipo
    const { data: equipoData } = await supabase
      .from('equipo_terapeutico')
      .select('ninos(*)')
      .eq('usuario_id', user.id)
      .eq('permisos', 'edicion')

    const ninosEquipo = equipoData?.map(e => e.ninos) || []

    // Combinar y eliminar duplicados
    const todosNinos = [...(ninosPadre || []), ...ninosEquipo]
    const ninosUnicos = todosNinos.filter((nino, index, self) =>
      index === self.findIndex((n) => n.id === nino.id)
    )

    setNinos(ninosUnicos)
    
    // Si solo hay un niño, seleccionarlo automáticamente
    if (ninosUnicos.length === 1) {
      setFormData(prev => ({ ...prev, ninoId: ninosUnicos[0].id }))
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

    const supabase = createClient()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('No se pudo verificar tu sesión')
      setLoading(false)
      return
    }

    // Convertir actividades de string a array
    const actividadesArray = formData.actividades
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)

    // Insertar el registro
    const { data, error } = await supabase
      .from('registros_diarios')
      .insert([
        {
          nino_id: formData.ninoId,
          fecha: formData.fecha,
          estado_animo: formData.estadoAnimo || null,
          actividades: actividadesArray,
          logros: formData.logros || null,
          desafios: formData.desafios || null,
          notas: formData.notas || null,
          tipo_registro: formData.tipoRegistro,
          creado_por: user.id,
        }
      ])

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Redirigir al dashboard
    router.push('/dashboard')
    router.refresh()
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
                Primero necesitas agregar el perfil de un niño
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
            <CardTitle>Nuevo registro diario</CardTitle>
            <CardDescription>
              Documenta las actividades, logros y desafíos del día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  name="ninoId"
                  label="Niño"
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
                  type="date"
                  name="fecha"
                  label="Fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  name="estadoAnimo"
                  label="Estado de ánimo"
                  value={formData.estadoAnimo}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar...</option>
                  {Object.entries(ESTADOS_ANIMO).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.emoji} {value.label}
                    </option>
                  ))}
                </Select>

                <Select
                  name="tipoRegistro"
                  label="Tipo de registro"
                  value={formData.tipoRegistro}
                  onChange={handleChange}
                  required
                >
                  <option value="escuela">Escuela</option>
                  <option value="casa">Casa</option>
                  <option value="terapia">Terapia</option>
                </Select>
              </div>

              <Input
                type="text"
                name="actividades"
                label="Actividades realizadas"
                placeholder="Ej: Lectura, matemáticas, juego libre (separadas por comas)"
                value={formData.actividades}
                onChange={handleChange}
                helperText="Separa las actividades con comas"
              />

              <Textarea
                name="logros"
                label="Logros del día"
                placeholder="¿Qué logró hoy? ¿Hubo avances importantes?"
                value={formData.logros}
                onChange={handleChange}
                rows={3}
              />

              <Textarea
                name="desafios"
                label="Desafíos enfrentados"
                placeholder="¿Hubo situaciones difíciles? ¿Qué funcionó para manejarlas?"
                value={formData.desafios}
                onChange={handleChange}
                rows={3}
              />

              <Textarea
                name="notas"
                label="Notas adicionales"
                placeholder="Cualquier otra observación relevante..."
                value={formData.notas}
                onChange={handleChange}
                rows={3}
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
                  {loading ? 'Guardando...' : 'Guardar registro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
