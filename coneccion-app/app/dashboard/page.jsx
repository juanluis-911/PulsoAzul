import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Users, FileText, TrendingUp } from 'lucide-react'
import { obtenerSaludo, formatearFecha, ESTADOS_ANIMO } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Obtener los niños del usuario
  const { data: ninos, error: ninosError } = await supabase
    .from('ninos')
    .select('*')
    .eq('padre_id', user.id)
    .order('created_at', { ascending: false })

  // Obtener registros recientes
  const { data: registrosRecientes } = await supabase
    .from('registros_diarios')
    .select(`
      *,
      ninos (nombre, apellido)
    `)
    .in('nino_id', ninos?.map(n => n.id) || [])
    .order('fecha', { ascending: false })
    .limit(5)

  const saludo = obtenerSaludo()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {saludo}, {user.user_metadata?.nombre_completo?.split(' ')[0] || 'Padre'}
          </h1>
          <p className="text-slate-600">
            {ninos?.length > 0 
              ? `Tienes ${ninos.length} ${ninos.length === 1 ? 'niño registrado' : 'niños registrados'}`
              : 'Comienza agregando el perfil de tu hijo'}
          </p>
        </div>

        {/* Acciones rápidas */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/nino/nuevo">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-primary-300 bg-primary-50/50">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900">Agregar niño</h3>
                <p className="text-sm text-slate-600 text-center mt-1">
                  Crea el perfil de tu hijo
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/registro-diario">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Nuevo registro</h3>
                <p className="text-sm text-slate-600 text-center mt-1">
                  Documenta el día de hoy
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/invitar">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Invitar equipo</h3>
                <p className="text-sm text-slate-600 text-center mt-1">
                  Agrega maestras y terapeutas
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mis niños */}
          <Card>
            <CardHeader>
              <CardTitle>Mis niños</CardTitle>
              <CardDescription>Perfiles registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {ninos && ninos.length > 0 ? (
                <div className="space-y-3">
                  {ninos.map((nino) => (
                    <Link
                      key={nino.id}
                      href={`/nino/${nino.id}`}
                      className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <h4 className="font-semibold text-slate-900">
                        {nino.nombre} {nino.apellido}
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatearFecha(nino.fecha_nacimiento)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">No hay niños registrados aún</p>
                  <Link href="/nino/nuevo">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar niño
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registros recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad reciente</CardTitle>
              <CardDescription>Últimos registros</CardDescription>
            </CardHeader>
            <CardContent>
              {registrosRecientes && registrosRecientes.length > 0 ? (
                <div className="space-y-3">
                  {registrosRecientes.map((registro) => (
                    <div
                      key={registro.id}
                      className="p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {registro.ninos.nombre} {registro.ninos.apellido}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {formatearFecha(registro.fecha)}
                          </p>
                        </div>
                        {registro.estado_animo && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_ANIMO[registro.estado_animo].color}`}>
                            {ESTADOS_ANIMO[registro.estado_animo].emoji} {ESTADOS_ANIMO[registro.estado_animo].label}
                          </span>
                        )}
                      </div>
                      {registro.logros && (
                        <p className="text-sm text-slate-700 mt-2">
                          <strong>Logro:</strong> {registro.logros}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
