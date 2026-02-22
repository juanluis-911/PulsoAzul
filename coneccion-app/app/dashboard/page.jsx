import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Users, FileText, TrendingUp } from 'lucide-react'
import { obtenerSaludo, formatearFecha, ESTADOS_ANIMO } from '@/lib/utils'
import { RegistroCard } from '@/components/RegistroCard' // ajusta el nombre si es RegistroCards


export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  // ✅ .maybeSingle() no lanza error si no existe el perfil
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const rol = perfil?.rol_principal || 'padre'

  let ninos = []

  if (rol === 'padre') {
    const { data } = await supabase
      .from('ninos')
      .select('*')
      .eq('padre_id', user.id)
      .order('created_at', { ascending: false })
    ninos = data || []
  } else {
    const { data, error } = await supabase
      .from('equipo_terapeutico')
      .select(`
        nino_id,
        rol,
        ninos (*)
      `)
      .eq('usuario_id', user.id)

    if (error) console.error('Error obteniendo equipo:', error)
    ninos = data?.map(e => e.ninos).filter(Boolean) || []
  }

  const { data: registrosRecientes } = await supabase
  .from('registros_diarios')
  .select(`id, fecha, estado_animo, actividades, logros, desafios, notas, tipo_registro, creado_por, ninos (nombre, apellido)`)
  .in('nino_id', ninos.map(n => n.id))
  .order('fecha', { ascending: false })
  .limit(5)

// IDs únicos de los autores
const autorIds = [...new Set(registrosRecientes?.map(r => r.creado_por).filter(Boolean))]

const { data: autores } = await supabase
  .from('perfiles')
  .select('id, nombre_completo, rol_principal')
  .in('id', autorIds)

// Combinar manualmente
const registrosConAutor = registrosRecientes?.map(r => ({
  ...r,
  perfiles: autores?.find(a => a.id === r.creado_por) || null
}))

  const etiquetaRol = {
    padre: 'Padre',
    maestra_sombra: 'Maestra',
    terapeuta: 'Terapeuta',
  }[rol] || 'Usuario'

  const saludo = obtenerSaludo()

  // ✅ nombreMostrar se usa consistentemente en el saludo
  const nombreMostrar = perfil?.nombre_completo?.split(' ')[0]
    || user.user_metadata?.nombre_completo?.split(' ')[0]
    || etiquetaRol
  console.log('perfil: '+perfil);
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0 px-4 py-6 md:p-8">
        <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          {/* ✅ Usa nombreMostrar, no user.user_metadata directo */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {saludo}, {nombreMostrar}
          </h1>
          <p className="text-slate-600">
            {rol === 'padre'
              ? ninos.length > 0
                ? `Tienes ${ninos.length} ${ninos.length === 1 ? 'niño registrado' : 'niños registrados'}`
                : 'Comienza agregando el perfil de tu hijo'
              : `Tienes acceso a ${ninos.length} ${ninos.length === 1 ? 'niño' : 'niños'}`
            }
          </p>
        </div>

        {/* Acciones rápidas */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {rol === 'padre' && (
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
          )}

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

          {rol === 'padre' && (
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
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Registros recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad reciente</CardTitle>
              <CardDescription>Últimos registros</CardDescription>
            </CardHeader>            
            <CardContent>
              {registrosConAutor && registrosConAutor.length > 0 ? (
                <div className="space-y-3">
                  {registrosConAutor.map((registro) => (
                    <RegistroCard key={registro.id} registro={registro} />
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
            <Link href="/historial">
              <Button variant="outline" size="sm">Ver todo</Button>
            </Link>
          </Card>
          {/* Mis niños / Niños asignados */}
          <Card>
            <CardHeader>
              {/* ✅ Título según rol */}
              <CardTitle>{rol === 'padre' ? 'Mis niños' : 'Niños asignados'}</CardTitle>
              <CardDescription>
                {rol === 'padre' ? 'Perfiles registrados' : 'Niños en tu seguimiento'}
              </CardDescription>
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
                  {rol === 'padre' ? (
                    // ✅ Solo el padre ve el botón para agregar niños
                    <>
                      <p className="text-slate-600 mb-4">No hay niños registrados aún</p>
                      <Link href="/nino/nuevo">
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar niño
                        </Button>
                      </Link>
                    </>
                  ) : (
                    // ✅ Terapeuta/maestra ven mensaje informativo
                    <p className="text-slate-600">
                      Aún no tienes niños asignados. El padre o tutor debe invitarte desde su cuenta.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
    </div>
  )
}