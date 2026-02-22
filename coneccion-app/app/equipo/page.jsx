import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { EquipoNinoCard } from '@/components/EquipoNinoCard'
import { Users } from 'lucide-react'

export default async function EquipoPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const rol = perfil?.rol_principal || 'padre'

  // Obtener niños según rol
  let ninos = []
  if (rol === 'padre') {
    const { data } = await supabase
      .from('ninos')
      .select('*')
      .eq('padre_id', user.id)
      .order('created_at', { ascending: false })
    ninos = data || []
  } else {
    const { data } = await supabase
      .from('equipo_terapeutico')
      .select('ninos (*)')
      .eq('usuario_id', user.id)
    ninos = data?.map(e => e.ninos).filter(Boolean) || []
  }

  // Para cada niño obtener su equipo completo
  const ninosConEquipo = await Promise.all(
    ninos.map(async (nino) => {
      // 1. Obtener miembros del equipo (sin el padre)
      const { data: equipo } = await supabase
        .from('equipo_terapeutico')
        .select('usuario_id, rol, permisos')
        .eq('nino_id', nino.id)
        .neq('usuario_id', nino.padre_id)

      if (!equipo || equipo.length === 0) return { ...nino, equipo: [] }

      // 2. Obtener perfiles de esos usuarios
      const ids = equipo.map(e => e.usuario_id)
      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, rol_principal, telefono')
        .in('id', ids)

      // 3. Combinar
      const equipoConPerfil = equipo.map(e => ({
        ...e,
        perfiles: perfiles?.find(p => p.id === e.usuario_id) || null
      }))

      return { ...nino, equipo: equipoConPerfil }
    })
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0 px-4 py-6 md:p-8">
        <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Red de apoyo</h1>
          <p className="text-slate-600">
            {rol === 'padre'
              ? 'El equipo de profesionales que acompañan a tus hijos'
              : 'Los niños y equipos en los que participas'}
          </p>
        </div>

        {ninosConEquipo.length > 0 ? (
          <div className="space-y-4">
            {ninosConEquipo.map((nino) => (
              <EquipoNinoCard key={nino.id} nino={nino} rol={rol} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Sin equipo aún</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                {rol === 'padre'
                  ? 'Agrega un niño e invita a su equipo desde el dashboard'
                  : 'Aún no tienes niños asignados'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      </main>
    </div>
  )
}