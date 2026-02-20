import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Edit, UserPlus, Calendar, Users, FileText } from 'lucide-react'
import { formatearFecha, calcularEdad } from '@/lib/utils'

export default async function NinoPerfilPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Obtener datos del niño
  const { data: nino, error: ninoError } = await supabase
    .from('ninos')
    .select('*')
    .eq('id', id)
    .single()

  if (ninoError || !nino) {
    redirect('/dashboard')
  }

  // Obtener equipo terapéutico
  const { data: equipo } = await supabase
    .from('equipo_terapeutico')
    .select(`
      *,
      perfiles (nombre_completo, rol_principal)
    `)
    .eq('nino_id', id)

  // Obtener registros recientes
  const { data: registros } = await supabase
    .from('registros_diarios')
    .select('*')
    .eq('nino_id', id)
    .order('fecha', { ascending: false })
    .limit(5)

  const edad = calcularEdad(nino.fecha_nacimiento)
  const esPadre = nino.padre_id === user.id

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Columna principal - Información del niño */}
          <div className="md:col-span-2 space-y-6">
            {/* Header del perfil */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      {nino.nombre} {nino.apellido}
                    </h1>
                    <div className="flex items-center gap-4 text-slate-600">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {edad} años
                      </span>
                      <span>•</span>
                      <span>{formatearFecha(nino.fecha_nacimiento)}</span>
                    </div>
                  </div>
                  
                  {esPadre && (
                    <Link href={`/nino/${id}/editar`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                  )}
                </div>

                {nino.diagnostico && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-slate-700 mb-1">Diagnóstico</h3>
                    <p className="text-slate-900">{nino.diagnostico}</p>
                  </div>
                )}

                {nino.notas_adicionales && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-1">Notas</h3>
                    <p className="text-slate-600">{nino.notas_adicionales}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registros recientes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Actividad reciente</CardTitle>
                    <CardDescription>Últimos 5 registros</CardDescription>
                  </div>
                  <Link href="/registro-diario">
                    <Button size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Nuevo registro
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {registros && registros.length > 0 ? (
                  <div className="space-y-4">
                    {registros.map((registro) => (
                      <div
                        key={registro.id}
                        className="border-l-4 border-primary-500 pl-4 py-2 bg-slate-50 rounded-r-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-slate-900">
                            {formatearFecha(registro.fecha)}
                          </p>
                          <span className="text-xs text-slate-500">
                            {registro.tipo_registro}
                          </span>
                        </div>
                        {registro.logros && (
                          <p className="text-sm text-slate-700">
                            <strong>✨ Logro:</strong> {registro.logros}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600 mb-4">No hay registros aún</p>
                    <Link href="/registro-diario">
                      <Button size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Crear primer registro
                      </Button>
                    </Link>
                  </div>
                )}
                
                {registros && registros.length > 0 && (
                  <div className="mt-4 text-center">
                    <Link 
                      href="/progreso"
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Ver todos los registros →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral - Equipo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Equipo
                    </CardTitle>
                    <CardDescription>
                      {equipo?.length || 0} miembros
                    </CardDescription>
                  </div>
                  {esPadre && (
                    <Link href="/invitar">
                      <Button variant="ghost" size="sm">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {equipo && equipo.length > 0 ? (
                  <div className="space-y-3">
                    {equipo.map((miembro) => (
                      <div
                        key={miembro.id}
                        className="p-3 bg-slate-50 rounded-lg"
                      >
                        <p className="font-medium text-slate-900">
                          {miembro.perfiles?.nombre_completo || 'Usuario'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {miembro.rol === 'padre' && 'Padre/Madre'}
                            {miembro.rol === 'maestra_sombra' && 'Maestra Sombra'}
                            {miembro.rol === 'terapeuta' && 'Terapeuta'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {miembro.permisos === 'edicion' ? 'Edición' : 'Lectura'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-600 mb-3">
                      No hay equipo invitado aún
                    </p>
                    {esPadre && (
                      <Link href="/invitar">
                        <Button size="sm" variant="outline">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invitar equipo
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/registro-diario" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Nuevo registro
                  </Button>
                </Link>
                <Link href="/progreso" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver progreso
                  </Button>
                </Link>
                {esPadre && (
                  <Link href="/invitar" className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invitar al equipo
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}