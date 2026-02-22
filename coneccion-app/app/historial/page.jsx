'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Search, Filter, ChevronLeft, ChevronRight, FileText, Calendar } from 'lucide-react'
import { formatearFecha, ESTADOS_ANIMO } from '@/lib/utils'

const PAGE_SIZE = 10

const CONTEXTO_LABELS = {
  escuela: 'Escuela',
  casa: 'Casa',
  terapia: 'Terapia',
}

export default function HistorialPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [ninos, setNinos] = useState([])
  const [registros, setRegistros] = useState([])
  const [autores, setAutores] = useState({})
  const [loading, setLoading] = useState(true)

  // Filtros
  const [ninoId, setNinoId] = useState('todos')
  const [contexto, setContexto] = useState('todos')
  const [estadoAnimo, setEstadoAnimo] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Paginación
  const [pagina, setPagina] = useState(1)

  useEffect(() => { init() }, [])

  const init = async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)

    // Obtener niños accesibles
    const { data: perfil } = await supabase.from('perfiles').select('rol_principal').eq('id', u.id).maybeSingle()
    const rol = perfil?.rol_principal || 'padre'

    let ninosData = []
    if (rol === 'padre') {
      const { data } = await supabase.from('ninos').select('*').eq('padre_id', u.id)
      ninosData = data || []
    } else {
      const { data } = await supabase.from('equipo_terapeutico').select('ninos(*)').eq('usuario_id', u.id)
      ninosData = data?.map(e => e.ninos).filter(Boolean) || []
    }
    setNinos(ninosData)

    if (!ninosData.length) { setLoading(false); return }

    // Traer TODOS los registros (sin limit)
    const { data: regs } = await supabase
      .from('registros_diarios')
      .select('id, fecha, estado_animo, actividades, logros, desafios, notas, tipo_registro, creado_por, nino_id, ninos(nombre, apellido)')
      .in('nino_id', ninosData.map(n => n.id))
      .order('fecha', { ascending: false })

    const regsData = regs || []
    setRegistros(regsData)

    // Obtener autores
    const autorIds = [...new Set(regsData.map(r => r.creado_por).filter(Boolean))]
    if (autorIds.length) {
      const { data: autoresData } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, rol_principal')
        .in('id', autorIds)
      const map = {}
      autoresData?.forEach(a => { map[a.id] = a })
      setAutores(map)
    }

    setLoading(false)
  }

  // Filtrado
  const filtrados = useMemo(() => {
    return registros.filter(r => {
      if (ninoId !== 'todos' && r.nino_id !== ninoId) return false
      if (contexto !== 'todos' && r.tipo_registro !== contexto) return false
      if (estadoAnimo !== 'todos' && r.estado_animo !== estadoAnimo) return false
      if (fechaDesde && r.fecha < fechaDesde) return false
      if (fechaHasta && r.fecha > fechaHasta) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const haystack = [r.logros, r.desafios, r.notas, r.actividades].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [registros, ninoId, contexto, estadoAnimo, fechaDesde, fechaHasta, busqueda])

  // Resetear página al cambiar filtros
  useEffect(() => { setPagina(1) }, [ninoId, contexto, estadoAnimo, fechaDesde, fechaHasta, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginados = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  const limpiarFiltros = () => {
    setNinoId('todos')
    setContexto('todos')
    setEstadoAnimo('todos')
    setBusqueda('')
    setFechaDesde('')
    setFechaHasta('')
  }

  const hayFiltrosActivos = ninoId !== 'todos' || contexto !== 'todos' || estadoAnimo !== 'todos' || busqueda || fechaDesde || fechaHasta

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="flex-1 pt-14 md:pt-0 flex items-center justify-center">
        <p className="text-slate-600">Cargando registros...</p>
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0 px-4 py-6 md:p-8">
        <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2">
              <ArrowLeft className="w-4 h-4" /> Volver al dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Historial de registros</h1>
            <p className="text-slate-500 text-sm mt-1">
              {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'} encontrados
              {hayFiltrosActivos && ' (con filtros activos)'}
            </p>
          </div>
          <Link href="/registro-diario">
            <Button size="sm">
              <FileText className="w-4 h-4 mr-2" /> Nuevo registro
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">

              {/* Búsqueda */}
              <div className="relative sm:col-span-2 md:col-span-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en logros, desafíos, notas..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                />
              </div>

              {/* Niño */}
              {ninos.length > 1 && (
                <select
                  value={ninoId}
                  onChange={e => setNinoId(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="todos">Todos los niños</option>
                  {ninos.map(n => (
                    <option key={n.id} value={n.id}>{n.nombre} {n.apellido}</option>
                  ))}
                </select>
              )}

              {/* Contexto */}
              <select
                value={contexto}
                onChange={e => setContexto(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="todos">Todos los contextos</option>
                {Object.entries(CONTEXTO_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>

              {/* Estado de ánimo */}
              <select
                value={estadoAnimo}
                onChange={e => setEstadoAnimo(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="todos">Todos los estados</option>
                {Object.entries(ESTADOS_ANIMO || {}).map(([v, l]) => (
                  <option key={v} value={v}>{typeof l === 'object' ? l.label : l}</option>
                ))}
              </select>

              {/* Fecha desde */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  placeholder="Desde"
                />
              </div>

              {/* Fecha hasta */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  placeholder="Hasta"
                />
              </div>
            </div>

            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Limpiar filtros
              </button>
            )}
          </CardContent>
        </Card>

        {/* Lista de registros */}
        {paginados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No hay registros{hayFiltrosActivos ? ' con los filtros aplicados' : ''}</p>
              {hayFiltrosActivos && (
                <button onClick={limpiarFiltros} className="text-sm text-primary-600 hover:underline mt-2">
                  Quitar filtros
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginados.map(r => {
              const autor = autores[r.creado_por]
              const estado = ESTADOS_ANIMO?.[r.estado_animo]
              const emoji = typeof estado === 'object' ? estado.emoji : null
              const label = typeof estado === 'object' ? estado.label : estado || r.estado_animo

              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Cabecera */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-slate-900 text-sm">
                            {r.ninos ? `${r.ninos.nombre} ${r.ninos.apellido}` : '—'}
                          </span>
                          <span className="text-slate-400 text-xs">·</span>
                          <span className="text-slate-500 text-xs">{formatearFecha(r.fecha)}</span>
                          {r.tipo_registro && (
                            <>
                              <span className="text-slate-400 text-xs">·</span>
                              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                {CONTEXTO_LABELS[r.tipo_registro] || r.tipo_registro}
                              </span>
                            </>
                          )}
                          {r.estado_animo && (
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              {emoji} {label}
                            </span>
                          )}
                        </div>

                        {/* Contenido */}
                        {r.logros && (
                          <p className="text-sm text-slate-700 mb-1">
                            <span className="font-medium text-green-700">Logros:</span> {r.logros}
                          </p>
                        )}
                        {r.desafios && (
                          <p className="text-sm text-slate-700 mb-1">
                            <span className="font-medium text-orange-600">Desafíos:</span> {r.desafios}
                          </p>
                        )}
                        {r.notas && (
                          <p className="text-sm text-slate-500 italic line-clamp-2">{r.notas}</p>
                        )}

                        {/* Autor */}
                        {autor && (
                          <p className="text-xs text-slate-400 mt-2">
                            Por {autor.nombre_completo}
                            {autor.rol_principal && ` · ${autor.rol_principal.replace('_', ' ')}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600">
              Página <span className="font-semibold text-slate-900">{pagina}</span> de <span className="font-semibold">{totalPaginas}</span>
            </span>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        </div>
      </main>
    </div>
  )
}