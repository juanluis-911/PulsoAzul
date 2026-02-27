import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Plus, Users, FileText, ChevronRight, Sparkles, Heart, BookOpen, MessageCircle } from 'lucide-react'
import { obtenerSaludo, formatearFecha, calcularEdad, ESTADOS_ANIMO } from '@/lib/utils'
import { RegistroCard } from '@/components/RegistroCard'


// ─── Componente: avatar con iniciales ────────────────────────────────────────
function AvatarInicial({ nombre, className = '' }) {
  const inicial = nombre?.charAt(0)?.toUpperCase() || '?'
  const colores = [
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
  ]
  const color = colores[inicial.charCodeAt(0) % colores.length]
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold ${color} ${className}`}>
      {inicial}
    </span>
  )
}

// ─── Componente: tarjeta de acción rápida ─────────────────────────────────────
function AccionCard({ href, icon: Icon, label, sublabel, iconBg, iconColor }) {
  return (
    <Link href={href} className="group flex-1">
      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm 
                      active:scale-95 transition-all duration-150 hover:shadow-md hover:border-slate-200 h-full">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{label}</p>
          {sublabel && <p className="text-xs text-slate-400 mt-0.5 leading-tight">{sublabel}</p>}
        </div>
      </div>
    </Link>
  )
}

// ─── Componente: tarjeta de niño ──────────────────────────────────────────────
function NinoCard({ nino }) {
  const edad = calcularEdad(nino.fecha_nacimiento)
  return (
    <Link href={`/nino/${nino.id}`} className="block group">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-primary-50 
                      border border-transparent hover:border-primary-100 transition-all duration-150 active:scale-98">
        <AvatarInicial nombre={nino.nombre} className="w-10 h-10 text-base shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {nino.nombre} {nino.apellido}
          </p>
          <p className="text-xs text-slate-500">
            {edad ? `${edad} ${edad === 1 ? 'año' : 'años'}` : formatearFecha(nino.fecha_nacimiento)}
          </p>
          {nino.diagnostico && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              🩺 {nino.diagnostico}
            </p>
          )}
          {nino.nombre_padre && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              👨‍👩‍👧 {nino.nombre_padre}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors shrink-0" />
      </div>
    </Link>
  )
}

// ─── Componente: sección con encabezado ───────────────────────────────────────
function Seccion({ titulo, descripcion, href, hrefLabel, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-slate-50">
        <div>
          <h2 className="font-bold text-slate-900 text-base">{titulo}</h2>
          {descripcion && <p className="text-xs text-slate-400 mt-0.5">{descripcion}</p>}
        </div>
        {href && (
          <Link href={href} className="text-xs font-semibold text-primary-600 hover:text-primary-700 
                                       flex items-center gap-0.5 shrink-0 ml-4 mt-0.5">
            {hrefLabel || 'Ver todo'}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Estado vacío genérico ────────────────────────────────────────────────────
function EstadoVacio({ emoji, texto, href, btnLabel, BtnIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="text-3xl mb-2">{emoji}</span>
      <p className="text-sm text-slate-500 mb-4 max-w-[200px] leading-snug">{texto}</p>
      {href && (
        <Link href={href}>
          <Button size="sm" className="gap-1.5">
            {BtnIcon && <BtnIcon className="w-4 h-4" />}
            {btnLabel}
          </Button>
        </Link>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

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
    // Paso 1: traer niños asignados
    const { data, error } = await supabase
      .from('equipo_terapeutico')
      .select('nino_id, rol, ninos (*)')
      .eq('usuario_id', user.id)

    if (error) console.error('Error obteniendo equipo:', error)

    const ninosRaw = data?.map(e => e.ninos).filter(Boolean) || []

    // Paso 2: traer perfiles de los padres
    const padreIds = [...new Set(ninosRaw.map(n => n.padre_id).filter(Boolean))]
    let perfilesPadres = []

    if (padreIds.length > 0) {
      const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('id, nombre_completo')
        .in('id', padreIds)
      perfilesPadres = perfilesData || []
    }

    // Paso 3: combinar
    ninos = ninosRaw.map(n => ({
      ...n,
      nombre_padre: perfilesPadres.find(p => p.id === n.padre_id)?.nombre_completo || null,
    }))
  }

  const { data: registrosRecientes } = await supabase
    .from('registros_diarios')
    .select('id, fecha, estado_animo, actividades, logros, desafios, notas, tipo_registro, creado_por, metricas, ninos (nombre, apellido)')
    .in('nino_id', ninos.length ? ninos.map(n => n.id) : [''])
    .order('created_at', { ascending: false })  
    .order('fecha', { ascending: false })
    .limit(5)

  const autorIds = [...new Set(registrosRecientes?.map(r => r.creado_por).filter(Boolean))]
  const { data: autores } = await supabase
    .from('perfiles')
    .select('id, nombre_completo, rol_principal')
    .in('id', autorIds.length ? autorIds : [''])
    

  const registrosConAutor = registrosRecientes?.map(r => ({
    ...r,
    perfiles: autores?.find(a => a.id === r.creado_por) || null,
  }))

  const etiquetaRol = { padre: 'Padre', maestra_sombra: 'Maestra', terapeuta: 'Terapeuta' }[rol] || 'Usuario'
  const saludo = obtenerSaludo()
  const nombreMostrar =
    perfil?.nombre_completo ||
    user.user_metadata?.nombre_completo ||
    etiquetaRol

  const ultimoRegistro = registrosConAutor?.[0]
  const ultimoEstado = ultimoRegistro?.estado_animo
    ? ESTADOS_ANIMO[ultimoRegistro.estado_animo]
    : null

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {/* ── Hero / encabezado ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-sky-400 px-5 pt-6 pb-8 md:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-primary-100 text-sm font-medium mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {saludo}
                </p>
                <h1 className="text-2xl font-bold text-white">{nombreMostrar}</h1>
                <p className="text-primary-100 text-sm mt-1">
                  {rol === 'padre'
                    ? ninos.length > 0
                      ? `${ninos.length} ${ninos.length === 1 ? 'niño registrado' : 'niños registrados'}`
                      : 'Comienza agregando el perfil de tu hijo'
                    : `${ninos.length} ${ninos.length === 1 ? 'niño asignado' : 'niños asignados'}`}
                </p>
              </div>
              <AvatarInicial
                nombre={nombreMostrar}
                className="w-11 h-11 text-lg border-2 border-white/30 shrink-0"
              />
            </div>

            {ultimoEstado && (
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm 
                              border border-white/20 rounded-full px-3 py-1.5">
                <span className="text-base">{ultimoEstado.emoji}</span>
                <span className="text-white text-xs font-medium">
                  Último registro: {ultimoEstado.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Contenido principal ─────────────────────────────────────────── */}
        <div className="px-4 md:px-8 -mt-4 max-w-2xl mx-auto md:max-w-5xl pb-10">

          {/* ── Acciones rápidas ──────────────────────────────────────────── */}
          <div className={`flex gap-3 mb-6 ${rol === 'padre' ? '' : 'justify-center'}`}>
            <AccionCard
              href="/mensajes"
              icon={MessageCircle}
              label="Mensajes"
              sublabel="Chat del equipo"
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <AccionCard
              href="/registro-diario"
              icon={FileText}
              label="Nuevo registro"
              sublabel="Documenta el día"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            {rol === 'padre' && (
              <>
                <AccionCard
                  href="/nino/nuevo"
                  icon={Plus}
                  label="Agregar niño"
                  sublabel="Crear perfil"
                  iconBg="bg-primary-50"
                  iconColor="text-primary-600"
                />
                <AccionCard
                  href="/invitar"
                  icon={Users}
                  label="Invitar equipo"
                  sublabel="Terapeutas"
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                />
              </>
            )}
          </div>

          {/* ── Grid principal ────────────────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-2">

            {/* Actividad reciente */}
            <Seccion
              titulo="Actividad reciente"
              descripcion="Últimos registros del equipo"
              href="/historial"
            >
              {registrosConAutor?.length > 0 ? (
                <div className="space-y-3">
                  {registrosConAutor.map(r => (
                    <RegistroCard key={r.id} registro={r} />
                  ))}
                </div>
              ) : (
                <EstadoVacio
                  emoji="📋"
                  texto="Aún no hay registros. ¡Documenta el primer día!"
                  href="/registro-diario"
                  btnLabel="Crear primer registro"
                  BtnIcon={FileText}
                />
              )}
            </Seccion>

            {/* Niños */}
            <Seccion
              titulo={rol === 'padre' ? 'Mis niños' : 'Niños asignados'}
              descripcion={rol === 'padre' ? 'Perfiles registrados' : 'Niños en tu seguimiento'}
              href={rol === 'padre' ? '/nino/nuevo' : undefined}
              hrefLabel={rol === 'padre' ? '+ Agregar' : undefined}
            >
              {ninos.length > 0 ? (
                <div className="space-y-2">
                  {ninos.map(n => <NinoCard key={n.id} nino={n} />)}
                </div>
              ) : rol === 'padre' ? (
                <EstadoVacio
                  emoji="👶"
                  texto="Agrega el perfil de tu hijo para comenzar"
                  href="/nino/nuevo"
                  btnLabel="Agregar niño"
                  BtnIcon={Plus}
                />
              ) : (
                <EstadoVacio
                  emoji="🤝"
                  texto="El padre o tutor debe invitarte desde su cuenta"
                />
              )}
            </Seccion>

          </div>

          {/* ── Banner motivacional ───────────────────────────────────────── */}
          {ninos.length > 0 && (
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-violet-50 to-sky-50 
                            border border-violet-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Seguimiento constante</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Cada registro suma al progreso. ¡Sigue así!
                </p>
              </div>
              <Link href="/progreso">
                <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Progreso
                </Button>
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}