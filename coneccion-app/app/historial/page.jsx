'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft, Search, FileText, Calendar,
  ChevronLeft, ChevronRight, X, SlidersHorizontal,
  School, Heart, Home, Star, StickyNote, Brain,
  Users, Activity, Dumbbell, CheckCircle2,
} from 'lucide-react'
import { formatearFecha, ESTADOS_ANIMO } from '@/lib/utils'

const PAGE_SIZE = 10

const TIPO_MAP = {
  escuela: { label: 'Escuela', cls: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-400' },
  terapia: { label: 'Terapia', cls: 'bg-violet-50 text-violet-600', dot: 'bg-violet-400' },
  casa:    { label: 'Casa',    cls: 'bg-green-50 text-green-600',   dot: 'bg-green-400' },
}

const ROL_LABEL = {
  padre: 'Papá / Mamá',
  maestra_sombra: 'Maestra',
  terapeuta: 'Terapeuta',
}

const NIVEL_APOYO_LABEL = [
  'Independiente', 'Indicación verbal', 'Modelado',
  'Apoyo físico parcial', 'Apoyo físico total',
]
const FRECUENCIA_LABEL = ['Nunca', 'Pocas veces', 'Varias veces', 'Frecuente']
const CONTEXTO_EMOJI = {
  durmio_bien: '😴 Durmió bien',
  comio_bien: '🍽️ Comió bien',
  tomo_medicamento: '💊 Medicamento',
  cambio_rutina: '🔄 Cambio de rutina',
  evento_estresante: '⚡ Evento estresante',
  buen_descanso_fin: '🏖️ Descansó el fin',
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ children, className = '', onRemove }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      {children}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
          <div className="h-3 bg-slate-100 rounded w-2/5 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

// ── Tarjeta de registro ───────────────────────────────────────────────────────
function RegistroCard({ r, autor, onClick }) {
  const tipo   = TIPO_MAP[r.tipo_registro] ?? { label: r.tipo_registro, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' }
  const estado = r.estado_animo ? ESTADOS_ANIMO?.[r.estado_animo] : null

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden
                 hover:shadow-md hover:border-slate-200 active:scale-[0.99]
                 transition-all duration-150 cursor-pointer"
    >
      <div className={`h-1 w-full ${tipo.dot}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">
              {r.ninos ? `${r.ninos.nombre} ${r.ninos.apellido}` : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{formatearFecha(r.fecha)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
            <Chip className={tipo.cls}>{tipo.label}</Chip>
            {estado && <Chip className={estado.color}>{estado.emoji} {estado.label}</Chip>}
          </div>
        </div>
        <div className="space-y-1.5">
          {r.logros && (
            <p className="text-sm text-slate-700 leading-snug">
              <span className="font-semibold text-emerald-700">✨ Logro:</span> {r.logros}
            </p>
          )}
          {r.desafios && (
            <p className="text-sm text-slate-700 leading-snug">
              <span className="font-semibold text-orange-600">🎯 Desafío:</span> {r.desafios}
            </p>
          )}
          {r.notas && !r.logros && !r.desafios && (
            <p className="text-sm text-slate-500 italic line-clamp-2">{r.notas}</p>
          )}
        </div>
        {autor && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs
                             font-bold flex items-center justify-center shrink-0">
              {autor.nombre_completo?.charAt(0).toUpperCase()}
            </span>
            <p className="text-xs text-slate-400">
              {autor.nombre_completo?.split(' ')[0]}
              {autor.rol_principal && ` · ${ROL_LABEL[autor.rol_principal] ?? autor.rol_principal}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers del drawer ────────────────────────────────────────────────────────
function Section({ icon, titulo, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{titulo}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoBlock({ emoji, label, value, valueClass = 'text-slate-700' }) {
  if (!value) return null
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2.5">
      <p className="text-xs text-slate-400 mb-0.5">{emoji ? `${emoji} ` : ''}{label}</p>
      <p className={`text-sm leading-snug ${valueClass}`}>{value}</p>
    </div>
  )
}

function EscalaDisplay({ label, valor, max = 5, color }) {
  if (valor == null) return null
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2.5">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-bold text-slate-800">{valor}</span>
        <div className="flex gap-0.5 flex-1">
          {[...Array(max)].map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < valor ? color : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Drawer de detalle ─────────────────────────────────────────────────────────
function DetalleDrawer({ r, autor, onClose }) {
  const tipo   = TIPO_MAP[r.tipo_registro] ?? { label: r.tipo_registro, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' }
  const estado = r.estado_animo ? ESTADOS_ANIMO?.[r.estado_animo] : null
  const m      = r.metricas ?? {}

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', fn)
    }
  }, [onClose])

  const contextoFlags = m.contexto
    ? Object.entries(m.contexto).filter(([, v]) => v)
    : []

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed z-50 bg-white shadow-2xl
                      bottom-0 left-0 right-0 rounded-t-3xl max-h-[92dvh] overflow-y-auto
                      md:bottom-auto md:top-0 md:right-0 md:left-auto md:h-full md:w-[480px]
                      md:rounded-none md:rounded-l-3xl
                      transition-transform duration-300">

        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Barra de color */}
        <div className={`h-1 w-full ${tipo.dot}`} />

        {/* Header sticky */}
        <div className="sticky top-0 z-10 px-5 py-4 bg-white border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-base truncate">
                {r.ninos ? `${r.ninos.nombre} ${r.ninos.apellido}` : '—'}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-slate-400">{formatearFecha(r.fecha)}</span>
                <Chip className={tipo.cls}>{tipo.label}</Chip>
                {estado && <Chip className={estado.color}>{estado.emoji} {estado.label}</Chip>}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200
                         flex items-center justify-center shrink-0 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-5 py-5 space-y-6 pb-12">

          {(r.logros || r.desafios || r.notas) && (
            <Section icon={<Star className="w-4 h-4 text-amber-500" />} titulo="Resumen del día">
              <InfoBlock emoji="✨" label="Logros"   value={r.logros}   valueClass="text-emerald-700" />
              <InfoBlock emoji="🎯" label="Desafíos" value={r.desafios} valueClass="text-orange-600" />
              <InfoBlock emoji="📝" label="Notas"    value={r.notas} />
            </Section>
          )}

          {contextoFlags.length > 0 && (
            <Section icon={<StickyNote className="w-4 h-4 text-blue-500" />} titulo="Contexto del día">
              <div className="flex flex-wrap gap-2">
                {contextoFlags.map(([k]) => (
                  <span key={k} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                    {CONTEXTO_EMOJI[k] ?? k}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {m.regulacion && (
            <Section icon={<Brain className="w-4 h-4 text-violet-500" />} titulo="Regulación emocional">
              <div className="grid grid-cols-2 gap-3">
                <EscalaDisplay label="Inicio del día" valor={m.regulacion.inicio} color="bg-violet-400" />
                <EscalaDisplay label="Final del día"  valor={m.regulacion.fin}   color="bg-violet-400" />
              </div>
            </Section>
          )}

          {m.nivel_apoyo_general != null && (
            <Section icon={<Users className="w-4 h-4 text-sky-500" />} titulo="Nivel de apoyo">
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center
                                font-bold text-sky-700 text-lg shrink-0">
                  {m.nivel_apoyo_general}
                </div>
                <p className="text-sm text-slate-700">
                  {NIVEL_APOYO_LABEL[m.nivel_apoyo_general] ?? '—'}
                </p>
              </div>
            </Section>
          )}

          {m.conducta != null && (
            <Section icon={<Activity className="w-4 h-4 text-rose-500" />} titulo="Conducta">
              <InfoBlock label="Frecuencia disruptiva"
                value={FRECUENCIA_LABEL[m.conducta.frecuencia_disruptiva] ?? '—'} />
              {m.conducta.duracion_minutos > 0 && (
                <InfoBlock label="Duración estimada" value={`${m.conducta.duracion_minutos} min`} />
              )}
            </Section>
          )}

          {m.comunicacion && (
            <Section icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} titulo="Comunicación">
              <div className="grid grid-cols-2 gap-3">
                <EscalaDisplay label="Iniciativa" valor={m.comunicacion.iniciativa} color="bg-emerald-400" />
                <EscalaDisplay label="Claridad"   valor={m.comunicacion.claridad}   color="bg-emerald-400" />
              </div>
            </Section>
          )}

          {m.actividades?.length > 0 && (
            <Section icon={<Dumbbell className="w-4 h-4 text-orange-500" />} titulo="Actividades">
              <div className="flex flex-wrap gap-2">
                {m.actividades.map((a, i) => (
                  <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                    {a.tipo}{a.participacion != null ? ` · ${a.participacion}/3` : ''}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {autor && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs
                               font-bold flex items-center justify-center shrink-0">
                {autor.nombre_completo?.charAt(0).toUpperCase()}
              </span>
              <p className="text-xs text-slate-400">
                Registrado por{' '}
                <span className="font-medium text-slate-600">{autor.nombre_completo}</span>
                {autor.rol_principal && ` · ${ROL_LABEL[autor.rol_principal] ?? autor.rol_principal}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function HistorialPage() {
  const router = useRouter()
  const [user, setUser]           = useState(null)
  const [ninos, setNinos]         = useState([])
  const [registros, setRegistros] = useState([])
  const [autores, setAutores]     = useState({})
  const [loading, setLoading]     = useState(true)
  const [showFilters, setShowFilters]         = useState(false)
  const [selectedRegistro, setSelectedRegistro] = useState(null)

  // Filtros
  const [ninoId, setNinoId]           = useState('todos')
  const [contexto, setContexto]       = useState('todos')
  const [estadoAnimo, setEstadoAnimo] = useState('todos')
  const [busqueda, setBusqueda]       = useState('')
  const [fechaDesde, setFechaDesde]   = useState('')
  const [fechaHasta, setFechaHasta]   = useState('')
  const [pagina, setPagina]           = useState(1)

  useEffect(() => { init() }, [])

  const init = async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)

    const { data: perfil } = await supabase
      .from('perfiles').select('rol_principal').eq('id', u.id).maybeSingle()
    const rol = perfil?.rol_principal || 'padre'

    let ninosData = []
    if (rol === 'padre') {
      const { data } = await supabase.from('ninos').select('*').eq('padre_id', u.id)
      ninosData = data || []
    } else {
      const { data } = await supabase
        .from('equipo_terapeutico').select('ninos(*)').eq('usuario_id', u.id)
      ninosData = data?.map(e => e.ninos).filter(Boolean) || []
    }
    setNinos(ninosData)
    if (!ninosData.length) { setLoading(false); return }

    const { data: regs } = await supabase
      .from('registros_diarios')
      .select('id, fecha, estado_animo, logros, desafios, notas, tipo_registro, creado_por, nino_id, metricas, ninos(nombre, apellido)')
      .in('nino_id', ninosData.map(n => n.id))
      .order('fecha', { ascending: false })

    const regsData = regs || []
    setRegistros(regsData)

    const autorIds = [...new Set(regsData.map(r => r.creado_por).filter(Boolean))]
    if (autorIds.length) {
      const { data: autoresData } = await supabase
        .from('perfiles').select('id, nombre_completo, rol_principal').in('id', autorIds)
      const map = {}
      autoresData?.forEach(a => { map[a.id] = a })
      setAutores(map)
    }
    setLoading(false)
  }

  const filtrados = useMemo(() => registros.filter(r => {
    if (ninoId !== 'todos' && r.nino_id !== ninoId) return false
    if (contexto !== 'todos' && r.tipo_registro !== contexto) return false
    if (estadoAnimo !== 'todos' && r.estado_animo !== estadoAnimo) return false
    if (fechaDesde && r.fecha < fechaDesde) return false
    if (fechaHasta && r.fecha > fechaHasta) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (![r.logros, r.desafios, r.notas].join(' ').toLowerCase().includes(q)) return false
    }
    return true
  }), [registros, ninoId, contexto, estadoAnimo, fechaDesde, fechaHasta, busqueda])

  useEffect(() => { setPagina(1) }, [ninoId, contexto, estadoAnimo, fechaDesde, fechaHasta, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginados    = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  const limpiar = () => {
    setNinoId('todos'); setContexto('todos'); setEstadoAnimo('todos')
    setBusqueda(''); setFechaDesde(''); setFechaHasta('')
  }

  const hayFiltros = ninoId !== 'todos' || contexto !== 'todos' || estadoAnimo !== 'todos'
                  || busqueda || fechaDesde || fechaHasta

  const filtrosActivos = [
    ninoId !== 'todos'      && { key: 'nino',   label: ninos.find(n => n.id === ninoId)?.nombre,  clear: () => setNinoId('todos') },
    contexto !== 'todos'    && { key: 'ctx',    label: TIPO_MAP[contexto]?.label,                 clear: () => setContexto('todos') },
    estadoAnimo !== 'todos' && { key: 'estado', label: ESTADOS_ANIMO?.[estadoAnimo]?.label,        clear: () => setEstadoAnimo('todos') },
    fechaDesde              && { key: 'desde',  label: `Desde ${fechaDesde}`,                     clear: () => setFechaDesde('') },
    fechaHasta              && { key: 'hasta',  label: `Hasta ${fechaHasta}`,                     clear: () => setFechaHasta('') },
  ].filter(Boolean)

  const selectCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">

        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-600 px-5 pt-6 pb-10 md:px-8">
          <div className="max-w-3xl mx-auto">
            <Link href="/dashboard"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Historial</h1>
                <p className="text-white/60 text-sm mt-1">
                  {loading ? '…' : `${filtrados.length} ${filtrados.length === 1 ? 'registro' : 'registros'}`}
                  {hayFiltros && <span className="text-white/40"> · filtros activos</span>}
                </p>
              </div>
              <Link href="/registro-diario">
                <Button size="sm" className="gap-1.5 shrink-0 bg-white text-slate-800 hover:bg-slate-100">
                  <FileText className="w-3.5 h-3.5" /> Nuevo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-4 md:px-8 -mt-4 max-w-3xl mx-auto pb-10 space-y-4">

          {/* Búsqueda + toggle filtros */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar en logros, notas, desafíos…"
                className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium
                          shadow-sm transition-colors shrink-0
                          ${showFilters || hayFiltros
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {filtrosActivos.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-primary-700 text-xs font-bold
                                 flex items-center justify-center">
                  {filtrosActivos.length}
                </span>
              )}
            </button>
          </div>

          {/* Panel filtros */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ninos.length > 1 && (
                  <select value={ninoId} onChange={e => setNinoId(e.target.value)} className={selectCls}>
                    <option value="todos">Todos los niños</option>
                    {ninos.map(n => <option key={n.id} value={n.id}>{n.nombre} {n.apellido}</option>)}
                  </select>
                )}
                <select value={contexto} onChange={e => setContexto(e.target.value)} className={selectCls}>
                  <option value="todos">Todos los contextos</option>
                  {Object.entries(TIPO_MAP).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                </select>
                <select value={estadoAnimo} onChange={e => setEstadoAnimo(e.target.value)} className={selectCls}>
                  <option value="todos">Todos los estados</option>
                  {Object.entries(ESTADOS_ANIMO ?? {}).map(([v, l]) => (
                    <option key={v} value={v}>{typeof l === 'object' ? `${l.emoji} ${l.label}` : l}</option>
                  ))}
                </select>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                    className={`${selectCls} pl-9`} />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                    className={`${selectCls} pl-9`} />
                </div>
              </div>
              {hayFiltros && (
                <button onClick={limpiar} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          )}

          {/* Chips activos */}
          {filtrosActivos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filtrosActivos.map(f => (
                <Chip key={f.key} className="bg-primary-50 text-primary-700" onRemove={f.clear}>
                  {f.label}
                </Chip>
              ))}
            </div>
          )}

          {/* Lista */}
          {loading ? <Skeleton /> : paginados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col items-center py-16 text-center">
                <span className="text-4xl mb-3">🔍</span>
                <p className="font-semibold text-slate-700 mb-1">
                  {hayFiltros ? 'Sin resultados con estos filtros' : 'Aún no hay registros'}
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  {hayFiltros ? 'Prueba ajustando o quitando los filtros' : 'Comienza documentando el primer día'}
                </p>
                {hayFiltros
                  ? <button onClick={limpiar} className="text-sm text-primary-600 font-semibold hover:underline">Quitar filtros</button>
                  : <Link href="/registro-diario"><Button size="sm" className="gap-1.5"><FileText className="w-4 h-4" />Nuevo registro</Button></Link>
                }
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {paginados.map(r => (
                <RegistroCard
                  key={r.id}
                  r={r}
                  autor={autores[r.creado_por]}
                  onClick={() => setSelectedRegistro(r)}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {!loading && totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center
                           hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-500">
                <span className="font-bold text-slate-900">{pagina}</span> / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center
                           hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Drawer detalle */}
      {selectedRegistro && (
        <DetalleDrawer
          r={selectedRegistro}
          autor={autores[selectedRegistro.creado_por]}
          onClose={() => setSelectedRegistro(null)}
        />
      )}
    </div>
  )
}