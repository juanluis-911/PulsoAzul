import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, UserPlus, FileText, TrendingUp, MessageCircle } from 'lucide-react'
import { formatearFecha, calcularEdad, ESTADOS_ANIMO } from '@/lib/utils'
import { EditarNinoBtn } from '@/components/EditarNinoBtn'

// ── Avatar ────────────────────────────────────────────────────────────────────
function AvatarNino({ nombre }) {
  const inicial = nombre?.charAt(0)?.toUpperCase() || '?'
  return (
    <span className="inline-flex items-center justify-center w-20 h-20 rounded-full
                     bg-white/20 text-white text-3xl font-bold border-2 border-white/30 shrink-0">
      {inicial}
    </span>
  )
}

// ── Chip de rol ───────────────────────────────────────────────────────────────
function ChipRol({ rol }) {
  const map = {
    padre:          { label: 'Papá / Mamá',    cls: 'bg-amber-100 text-amber-700' },
    maestra_sombra: { label: 'Maestra Sombra', cls: 'bg-blue-100 text-blue-700' },
    terapeuta:      { label: 'Terapeuta',      cls: 'bg-violet-100 text-violet-700' },
  }
  const { label, cls } = map[rol] ?? { label: rol, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
}

// ── Tarjeta miembro ───────────────────────────────────────────────────────────
function MiembroCard({ miembro }) {
  const nombre = miembro.perfiles?.nombre_completo || 'Usuario'
  const inicial = nombre.charAt(0).toUpperCase()
  const permiso = miembro.permisos === 'edicion' ? '✏️ Edición' : '👁 Lectura'
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <span className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold
                       flex items-center justify-center text-sm shrink-0">
        {inicial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 truncate">{nombre}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <ChipRol rol={miembro.rol} />
          <span className="text-xs text-slate-400">{permiso}</span>
        </div>
      </div>
    </div>
  )
}

// ── Item de registro (timeline) ───────────────────────────────────────────────
function RegistroItem({ registro }) {
  const estado = registro.estado_animo ? ESTADOS_ANIMO[registro.estado_animo] : null
  const tipoMap = {
    escuela: { label: 'Escuela', cls: 'bg-blue-50 text-blue-600' },
    terapia: { label: 'Terapia', cls: 'bg-violet-50 text-violet-600' },
    casa:    { label: 'Casa',    cls: 'bg-green-50 text-green-600' },
  }
  const tipo = tipoMap[registro.tipo_registro] ?? { label: registro.tipo_registro, cls: 'bg-slate-50 text-slate-500' }

  return (
    <div className="flex gap-3 items-start py-3 border-b border-slate-50 last:border-0">
      <div className="flex flex-col items-center shrink-0 mt-1">
        <div className="w-2.5 h-2.5 rounded-full bg-primary-400" />
        <div className="w-px flex-1 bg-slate-100 mt-1 min-h-[20px]" />
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <p className="text-xs font-semibold text-slate-500">{formatearFecha(registro.fecha)}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipo.cls}`}>{tipo.label}</span>
            {estado && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.color}`}>
                {estado.emoji} {estado.label}
              </span>
            )}
          </div>
        </div>
        {registro.logros && (
          <p className="text-sm text-slate-700 leading-snug">
            <span className="font-medium">✨ Logro:</span> {registro.logros}
          </p>
        )}
        {!registro.logros && registro.notas && (
          <p className="text-sm text-slate-500 italic leading-snug line-clamp-2">{registro.notas}</p>
        )}
      </div>
    </div>
  )
}

// ── Campo de info ─────────────────────────────────────────────────────────────
function InfoField({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
    </div>
  )
}

// ── Sección con header ────────────────────────────────────────────────────────
function Seccion({ titulo, descripcion, accion, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-50">
        <div>
          <h2 className="font-bold text-slate-900 text-base">{titulo}</h2>
          {descripcion && <p className="text-xs text-slate-400 mt-0.5">{descripcion}</p>}
        </div>
        {accion}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Estado vacío ──────────────────────────────────────────────────────────────
function Vacio({ emoji, texto, href, btnLabel, BtnIcon }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
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

// ── Página ────────────────────────────────────────────────────────────────────
export default async function NinoPerfilPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  const { data: nino, error: ninoError } = await supabase
    .from('ninos').select('*').eq('id', id).single()
  if (ninoError || !nino) redirect('/dashboard')

  // Dos queries separados — no hay FK directa entre equipo_terapeutico y perfiles
  const { data: equipoRaw } = await supabase
    .from('equipo_terapeutico')
    .select('id, usuario_id, rol, permisos')
    .eq('nino_id', id)

  const equipoIds = (equipoRaw ?? []).map(m => m.usuario_id)
  const { data: perfilesEquipo } = equipoIds.length
    ? await supabase.from('perfiles').select('id, nombre_completo, rol_principal').in('id', equipoIds)
    : { data: [] }

  const equipo = (equipoRaw ?? []).map(m => ({
    ...m,
    perfiles: perfilesEquipo?.find(p => p.id === m.usuario_id) ?? null,
  }))

  const { data: registros } = await supabase
    .from('registros_diarios')
    .select('*')
    .eq('nino_id', id)
    .order('fecha', { ascending: false })
    .limit(5)

  const edad = calcularEdad(nino.fecha_nacimiento)
  const esPadre = nino.padre_id === user.id

  // Excluir al padre dueño del perfil — todos los demás son equipo
  const equipoVisible = (equipo ?? []).filter(m => m.usuario_id !== nino.padre_id)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600 via-primary-500 to-sky-400 px-5 pt-6 pb-10 md:px-8">
          <div className="max-w-5xl mx-auto">

            <Link href="/dashboard"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>

            {/* Fila: avatar + info + botón editar */}
            <div className="flex items-start justify-between gap-4 w-full">

              {/* Izquierda: avatar + datos */}
              <div className="flex items-center gap-4 min-w-0">
                <AvatarNino nombre={nino.nombre} />
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {nino.nombre} {nino.apellido}
                  </h1>
                  <p className="text-white/70 text-sm mt-1">
                    {edad ? `${edad} ${edad === 1 ? 'año' : 'años'} · ` : ''}
                    {formatearFecha(nino.fecha_nacimiento)}
                  </p>
                  {nino.diagnostico && (
                    <span className="mt-2 inline-block text-xs font-medium bg-white/15
                                     text-white border border-white/20 rounded-full px-2.5 py-1">
                      {nino.diagnostico}
                    </span>
                  )}
                </div>
              </div>

              {/* Derecha: botón editar — solo padre */}
              {esPadre && (
                <div className="shrink-0 pt-1">
                  <EditarNinoBtn nino={nino} />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Contenido ───────────────────────────────────────────────── */}
        <div className="px-4 md:px-8 -mt-4 max-w-5xl mx-auto pb-10">
          <div className="grid gap-4 md:grid-cols-3">

            {/* Columna principal */}
            <div className="md:col-span-2 space-y-4">

              {/* Info del perfil */}
              {(nino.diagnostico || nino.notas_adicionales) && (
                <Seccion titulo="Información del perfil">
                  <div className="space-y-4">
                    <InfoField label="Diagnóstico" value={nino.diagnostico} />
                    <InfoField label="Notas adicionales" value={nino.notas_adicionales} />
                  </div>
                </Seccion>
              )}

              {/* Registros */}
              <Seccion
                titulo="Actividad reciente"
                descripcion="Últimos 5 registros"
                accion={
                  <Link href="/registro-diario">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5" /> Nuevo
                    </Button>
                  </Link>
                }
              >
                {registros?.length > 0 ? (
                  <>
                    {registros.map(r => <RegistroItem key={r.id} registro={r} />)}
                    <Link href="/progreso"
                      className="flex items-center justify-center gap-1 pt-2 text-xs font-semibold
                                 text-primary-600 hover:text-primary-700 transition-colors">
                      <TrendingUp className="w-3.5 h-3.5" /> Ver todo el progreso
                    </Link>
                  </>
                ) : (
                  <Vacio emoji="📋" texto="Aún no hay registros"
                    href="/registro-diario" btnLabel="Crear primer registro" BtnIcon={FileText} />
                )}
              </Seccion>

            </div>

            {/* Columna lateral */}
            <div className="space-y-4">
              {/* Acciones rápidas */}
              <Seccion titulo="Acciones rápidas">
                <div className="space-y-1">
                  {[
                    { href: '/registro-diario', Icon: FileText,   label: 'Nuevo registro',  bg: 'bg-blue-50',   ic: 'text-blue-600' },
                    { href: '/progreso',        Icon: TrendingUp,  label: 'Ver progreso',    bg: 'bg-green-50',  ic: 'text-green-600' },
                    { href: `/mensajes/${nino.id}`, Icon: MessageCircle, label: 'Chat del equipo', bg: 'bg-indigo-50', ic: 'text-indigo-600' },

                    ...(esPadre ? [{ href: '/invitar', Icon: UserPlus, label: 'Invitar al equipo', bg: 'bg-violet-50', ic: 'text-violet-600' }] : []),
                  ].map(({ href, Icon, label, bg, ic }) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${ic}`} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
                    </Link>
                  ))}
                </div>
              </Seccion>
              {/* Equipo */}
              <Seccion
                titulo="Equipo"
                descripcion={`${equipoVisible.length} ${equipoVisible.length === 1 ? 'miembro' : 'miembros'}`}
                accion={
                  esPadre && (
                    <Link href="/invitar">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary-600 hover:text-primary-700">
                        <UserPlus className="w-3.5 h-3.5" /> Invitar
                      </Button>
                    </Link>
                  )
                }
              >
                {equipoVisible.length > 0 ? (
                  <div className="space-y-2">
                    {equipoVisible.map(m => <MiembroCard key={m.id} miembro={m} />)}
                  </div>
                ) : (
                  <Vacio
                    emoji="🤝"
                    texto={esPadre
                      ? 'Invita a terapeutas y maestras para trabajar juntos'
                      : 'Aún no hay otros miembros en el equipo'}
                    href={esPadre ? '/invitar' : undefined}
                    btnLabel="Invitar equipo"
                    BtnIcon={UserPlus}
                  />
                )}
              </Seccion>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}