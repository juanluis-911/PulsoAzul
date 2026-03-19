'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Trophy, Lock } from 'lucide-react'
import { LOGROS, LOGROS_MAP, NIVEL_CONFIG } from '@/lib/logros-definicion'

const ROL_LABEL = {
  padre: 'Papá / Mamá',
  maestra_sombra: 'Maestra Sombra',
  terapeuta: 'Terapeuta',
}

const CATEGORIA_LABEL = {
  inicio:        '🌱 Inicio',
  constancia:    '🔥 Constancia',
  racha:         '⚡ Rachas',
  volumen:       '📊 Volumen',
  calidad:       '📋 Calidad',
  colaboracion:  '🤝 Colaboración',
  tiempo:        '📅 Tiempo activo',
  equipo:        '👥 Equipo',
  metas:         '🎯 Metas',
  comunicacion:  '💬 Comunicación',
  especial:      '⭐ Especiales',
}

function LogroCard({ logro, obtenido, fechaObtenido }) {
  const nivel = NIVEL_CONFIG[logro.nivel]
  return (
    <div className={`relative rounded-2xl border p-4 transition-all
      ${obtenido
        ? `${nivel.bg} ${nivel.border} shadow-sm`
        : 'bg-slate-50 border-slate-100 opacity-60'
      }`}
    >
      {/* Nivel badge */}
      <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full
        ${obtenido ? `${nivel.bg} ${nivel.color} border ${nivel.border}` : 'bg-slate-100 text-slate-400'}`}>
        {nivel.label}
      </span>

      {/* Emoji + nombre */}
      <div className="flex items-start gap-3 pr-16">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0
          ${obtenido ? 'bg-white shadow-sm' : 'bg-slate-200'}`}>
          {obtenido ? logro.emoji : <Lock className="w-5 h-5 text-slate-400" />}
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-sm leading-tight ${obtenido ? 'text-slate-900' : 'text-slate-500'}`}>
            {logro.nombre}
          </p>
          <p className={`text-xs mt-0.5 leading-snug ${obtenido ? 'text-slate-600' : 'text-slate-400'}`}>
            {logro.descripcion}
          </p>
          {obtenido && fechaObtenido && (
            <p className={`text-[10px] mt-1.5 font-medium ${nivel.color}`}>
              Obtenido el {new Date(fechaObtenido).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LogrosPage() {
  const router = useRouter()
  const [user, setUser]         = useState(null)
  const [rol, setRol]           = useState(null)
  const [logrosMap, setLogrosMap] = useState({}) // { [logro_id]: obtenido_at }
  const [loading, setLoading]   = useState(true)
  const [evaluando, setEvaluando] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState('todos')

  useEffect(() => { init() }, [])

  const init = async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)

    const { data: perfil } = await supabase
      .from('perfiles').select('rol_principal').eq('id', u.id).maybeSingle()
    const r = perfil?.rol_principal || 'padre'
    setRol(r)

    const { data: logrosData } = await supabase
      .from('logros_usuario')
      .select('logro_id, obtenido_at')
      .eq('usuario_id', u.id)

    const map = {}
    ;(logrosData || []).forEach(l => { map[l.logro_id] = l.obtenido_at })
    setLogrosMap(map)
    setLoading(false)
  }

  const evaluarAhora = async () => {
    setEvaluando(true)
    try {
      const res = await fetch('/api/evaluar-logros', { method: 'POST' })
      const { logrosNuevos } = await res.json()
      if (logrosNuevos?.length) {
        const map = { ...logrosMap }
        logrosNuevos.forEach(l => { map[l.id] = new Date().toISOString() })
        setLogrosMap(map)
      }
    } catch {}
    setEvaluando(false)
  }

  // Logros del rol actual, ordenados: obtenidos primero, luego por nivel
  const ORDEN_NIVEL = { bronce: 1, plata: 2, oro: 3, platino: 4, diamante: 5 }
  const logrosRol = LOGROS.filter(l => l.rol === rol)
  const logrosCategoria = categoriaActiva === 'todos'
    ? logrosRol
    : logrosRol.filter(l => l.categoria === categoriaActiva)

  const logrosOrdenados = [...logrosCategoria].sort((a, b) => {
    const aObt = !!logrosMap[a.id]
    const bObt = !!logrosMap[b.id]
    if (aObt !== bObt) return aObt ? -1 : 1
    return ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]
  })

  const totalObtenidos = logrosRol.filter(l => logrosMap[l.id]).length
  const totalLogros    = logrosRol.length
  const pct = totalLogros ? Math.round((totalObtenidos / totalLogros) * 100) : 0

  const categorias = [...new Set(logrosRol.map(l => l.categoria))]

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Navbar user={null} />
        <main className="flex-1 flex items-center justify-center pt-14 md:pt-0">
          <p className="text-slate-500">Cargando logros…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">

        {/* Hero */}
        <div className="bg-gradient-to-br from-violet-700 to-violet-500 px-5 pt-6 pb-12 md:px-8">
          <div className="max-w-2xl mx-auto">
            <Link href="/dashboard"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-300" />
                  Mis Logros
                </h1>
                <p className="text-white/70 text-sm mt-1">
                  {ROL_LABEL[rol] || 'Usuario'} · {totalObtenidos} de {totalLogros} desbloqueados
                </p>
              </div>
              <button
                onClick={evaluarAhora}
                disabled={evaluando}
                className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold
                           px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {evaluando ? 'Evaluando…' : '🔄 Actualizar'}
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                <span>Progreso general</span>
                <span className="font-bold text-white">{pct}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Stats por nivel */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {Object.entries(NIVEL_CONFIG).map(([nivel, cfg]) => {
                const total = logrosRol.filter(l => l.nivel === nivel).length
                const obtenidos = logrosRol.filter(l => l.nivel === nivel && logrosMap[l.id]).length
                return (
                  <div key={nivel} className="bg-white/15 rounded-xl px-2 py-2 text-center">
                    <p className="text-lg">{cfg.icono}</p>
                    <p className="text-white font-bold text-sm">{obtenidos}/{total}</p>
                    <p className="text-white/60 text-[10px]">{cfg.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filtros de categoría */}
        <div className="sticky top-14 md:top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-4 py-3">
          <div className="max-w-2xl mx-auto overflow-x-auto">
            <div className="flex gap-2 w-max">
              <button
                onClick={() => setCategoriaActiva('todos')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all whitespace-nowrap
                  ${categoriaActiva === 'todos'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Todos ({logrosRol.length})
              </button>
              {categorias.map(cat => {
                const cnt = logrosRol.filter(l => l.categoria === cat && logrosMap[l.id]).length
                const tot = logrosRol.filter(l => l.categoria === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(cat)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all whitespace-nowrap
                      ${categoriaActiva === cat
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {CATEGORIA_LABEL[cat] || cat} {cnt > 0 && `(${cnt}/${tot})`}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Lista de logros */}
        <div className="px-4 py-6 max-w-2xl mx-auto">
          {logrosOrdenados.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl">🔒</span>
              <p className="text-slate-500 mt-3">No hay logros en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logrosOrdenados.map(logro => (
                <LogroCard
                  key={logro.id}
                  logro={logro}
                  obtenido={!!logrosMap[logro.id]}
                  fechaObtenido={logrosMap[logro.id]}
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
