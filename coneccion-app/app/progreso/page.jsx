import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatearFecha, ESTADOS_ANIMO, ROLES } from '@/lib/utils'
import { FileText, Calendar, TrendingUp } from 'lucide-react'

export default async function ProgresoPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Obtener los niños del usuario
  const { data: ninos } = await supabase
    .from('ninos')
    .select('*')
    .eq('padre_id', user.id)

  // Obtener también niños donde el usuario es parte del equipo
  const { data: equipoData } = await supabase
    .from('equipo_terapeutico')
    .select('ninos(*)')
    .eq('usuario_id', user.id)

  const ninosEquipo = equipoData?.map(e => e.ninos) || []
  const todosNinos = [...(ninos || []), ...ninosEquipo]
  const ninosUnicos = todosNinos.filter((nino, index, self) =>
    index === self.findIndex((n) => n.id === nino.id)
  )

  // Obtener todos los registros
  const { data: registros } = await supabase
    .from('registros_diarios')
    .select(`
      *,
      ninos (nombre, apellido),
      perfiles (nombre_completo)
    `)
    .in('nino_id', ninosUnicos.map(n => n.id))
    .order('fecha', { ascending: false })

  // Agrupar registros por mes
  const registrosPorMes = {}
  registros?.forEach(registro => {
    const fecha = new Date(registro.fecha)
    const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    if (!registrosPorMes[mesAnio]) {
      registrosPorMes[mesAnio] = []
    }
    registrosPorMes[mesAnio].push(registro)
  })

  // Estadísticas
  const totalRegistros = registros?.length || 0
  const registrosUltimaSemana = registros?.filter(r => {
    const fecha = new Date(r.fecha)
    const hoy = new Date()
    const diferencia = (hoy - fecha) / (1000 * 60 * 60 * 24)
    return diferencia <= 7
  }).length || 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Progreso</h1>
          <p className="text-slate-600">Timeline de actividades y logros</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total de registros</p>
                <p className="text-2xl font-bold text-slate-900">{totalRegistros}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Esta semana</p>
                <p className="text-2xl font-bold text-slate-900">{registrosUltimaSemana}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Niños registrados</p>
                <p className="text-2xl font-bold text-slate-900">{ninosUnicos.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline de registros */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline de registros</CardTitle>
            <CardDescription>Historial completo de actividades</CardDescription>
          </CardHeader>
          <CardContent>
            {registros && registros.length > 0 ? (
              <div className="space-y-8">
                {Object.entries(registrosPorMes).map(([mesAnio, registrosMes]) => {
                  const [anio, mes] = mesAnio.split('-')
                  const nombreMes = new Date(anio, mes - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                  
                  return (
                    <div key={mesAnio}>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 capitalize">
                        {nombreMes}
                      </h3>
                      <div className="space-y-4">
                        {registrosMes.map((registro) => (
                          <div
                            key={registro.id}
                            className="border-l-4 border-primary-500 pl-4 py-3 bg-slate-50 rounded-r-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-semibold text-slate-900">
                                    {registro.ninos.nombre} {registro.ninos.apellido}
                                  </h4>
                                  {registro.estado_animo && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_ANIMO[registro.estado_animo].color}`}>
                                      {ESTADOS_ANIMO[registro.estado_animo].emoji} {ESTADOS_ANIMO[registro.estado_animo].label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600">
                                  {formatearFecha(registro.fecha)} · {registro.tipo_registro}
                                </p>
                              </div>
                            </div>

                            {registro.actividades && registro.actividades.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-slate-700 mb-1">Actividades:</p>
                                <div className="flex flex-wrap gap-2">
                                  {registro.actividades.map((actividad, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                    >
                                      {actividad}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {registro.logros && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-slate-700 mb-1">✨ Logros:</p>
                                <p className="text-sm text-slate-700">{registro.logros}</p>
                              </div>
                            )}

                            {registro.desafios && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-slate-700 mb-1">⚡ Desafíos:</p>
                                <p className="text-sm text-slate-700">{registro.desafios}</p>
                              </div>
                            )}

                            {registro.notas && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-slate-700 mb-1">📝 Notas:</p>
                                <p className="text-sm text-slate-700">{registro.notas}</p>
                              </div>
                            )}

                            <div className="mt-3 text-xs text-slate-500">
                              Registrado por {registro.perfiles?.nombre_completo || 'Usuario'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">No hay registros aún</p>
                <Link href="/registro-diario">
                  <Button>
                    <FileText className="w-4 h-4 mr-2" />
                    Crear primer registro
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
