'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import ReactMarkdown from 'react-markdown'
import { FileText, TrendingUp, TrendingDown, Minus, Calendar, Filter, Copy, Check, Bot } from 'lucide-react'
// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONTEXTO_TIPO = {
  escuela: { label: 'Escuela', emoji: '🏫', color: '#6366f1' },
  casa:    { label: 'Casa',    emoji: '🏠', color: '#22c55e' },
  terapia: { label: 'Terapia', emoji: '🧩', color: '#f59e0b' },
}

const AREAS = [
  { key: 'regulacion_inicio', label: 'Regulación inicio', color: '#6366f1' },
  { key: 'regulacion_fin',    label: 'Regulación fin',    color: '#8b5cf6' },
  { key: 'comunicacion',      label: 'Comunicación',      color: '#22c55e' },
  { key: 'social',            label: 'Social',            color: '#f59e0b' },
  { key: 'academico',         label: 'Académico',         color: '#ef4444' },
  { key: 'motora',            label: 'Motora',            color: '#14b8a6' },
  { key: 'autonomia',         label: 'Autonomía',         color: '#f97316' },
  { key: 'apoyo',             label: 'Nivel apoyo',       color: '#64748b' },
]

const ESTADO_ANIMO_VALOR = { muy_dificil: 1, dificil: 2, regular: 3, bien: 4, muy_bien: 5 }

function avg(...vals) {
  const v = vals.filter(x => x !== null && x !== undefined)
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null
}

function semanaISO(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() || 7
  d.setDate(d.getDate() + 4 - day)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-S${String(week).padStart(2, '0')}`
}

function mesLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
}

function diaLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function extraerMetricas(r) {
  const m = r.metricas || {}
  const autonomiaVal = avg(m.autonomia?.higiene, m.autonomia?.alimentacion)
  // Autonomía: 0=independiente, 4=apoyo total → invertimos para que 5 sea mejor
  const autonomiaInv = autonomiaVal !== null ? +(4 - autonomiaVal + 1).toFixed(2) : null
  // Nivel apoyo general: idem invertido
  const apoyoInv = m.nivel_apoyo_general !== null && m.nivel_apoyo_general !== undefined
    ? +(4 - m.nivel_apoyo_general + 1).toFixed(2) : null

  return {
    fecha: r.fecha,
    tipo: r.tipo_registro,
    estado_animo_val: ESTADO_ANIMO_VALOR[r.estado_animo] || null,
    regulacion_inicio: m.regulacion?.inicio || null,
    regulacion_fin:    m.regulacion?.fin    || null,
    comunicacion:      avg(m.comunicacion?.iniciativa, m.comunicacion?.claridad),
    social:            avg(m.social?.interaccion, m.social?.turnos),
    academico:         avg(m.academico?.atencion, m.academico?.persistencia),
    motora:            avg(m.motora?.fina, m.motora?.gruesa),
    autonomia:         autonomiaInv,
    apoyo:             apoyoInv,
    conducta_freq:     m.conducta?.frecuencia_disruptiva ?? null,
    conducta_min:      m.conducta?.duracion_minutos ?? null,
    contexto:          m.contexto || {},
  }
}

function agrupar(datos, agrupacion) {
  const grupos = {}
  datos.forEach(d => {
    const key = agrupacion === 'semana' ? semanaISO(d.fecha)
              : agrupacion === 'mes'    ? mesLabel(d.fecha)
              : diaLabel(d.fecha)
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(d)
  })
  return Object.entries(grupos).map(([label, items]) => ({
    label,
    regulacion_inicio: avg(...items.map(i => i.regulacion_inicio)),
    regulacion_fin:    avg(...items.map(i => i.regulacion_fin)),
    comunicacion:      avg(...items.map(i => i.comunicacion)),
    social:            avg(...items.map(i => i.social)),
    academico:         avg(...items.map(i => i.academico)),
    motora:            avg(...items.map(i => i.motora)),
    autonomia:         avg(...items.map(i => i.autonomia)),
    apoyo:             avg(...items.map(i => i.apoyo)),
    conducta_freq:     avg(...items.map(i => i.conducta_freq)),
    n:                 items.length,
  }))
}

// ─── Sub-componentes visuales ─────────────────────────────────────────────────

function KPICard({ label, valor, max = 5, tendencia, color, emoji }) {
  const pct = valor !== null ? Math.round((valor / max) * 100) : null
  const TIcon = tendencia > 0 ? TrendingUp : tendencia < 0 ? TrendingDown : Minus
  const tColor = tendencia > 0 ? 'text-green-500' : tendencia < 0 ? 'text-red-400' : 'text-slate-400'
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="text-lg">{emoji}</span>
      </div>
      {valor !== null ? (
        <>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">{valor.toFixed(1)}</span>
            <span className="text-sm text-slate-400 mb-1">/ {max}</span>
            {tendencia !== null && (
              <TIcon className={`w-4 h-4 mb-1.5 ${tColor}`} />
            )}
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
        </>
      ) : (
        <span className="text-slate-400 text-sm">Sin datos</span>
      )}
    </div>
  )
}

function ContextoHeatmap({ datos }) {
  const flags = ['durmio_bien','comio_bien','tomo_medicamento','cambio_rutina','evento_estresante']
  const labels = { durmio_bien:'Durmió bien', comio_bien:'Comió bien', tomo_medicamento:'Medicamento', cambio_rutina:'Cambio rutina', evento_estresante:'Evento estresante' }
  const totales = {}
  flags.forEach(f => { totales[f] = datos.filter(d => d.contexto[f]).length })
  const n = datos.length || 1
  return (
    <div className="space-y-2">
      {flags.map(f => {
        const pct = Math.round((totales[f] / n) * 100)
        const positivo = ['durmio_bien','comio_bien','tomo_medicamento'].includes(f)
        const color = positivo ? '#22c55e' : '#ef4444'
        return (
          <div key={f} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-32 flex-shrink-0">{labels[f]}</span>
            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full flex items-center pl-2 transition-all"
                style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color }}>
                <span className="text-white text-xs font-bold">{pct > 15 ? `${pct}%` : ''}</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-700 w-8 text-right">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

function RadarArea({ datos }) {
  if (!datos.length) return null
  const radarData = [
    { area: 'Regulación', val: avg(...datos.map(d => avg(d.regulacion_inicio, d.regulacion_fin))) },
    { area: 'Comunicación', val: avg(...datos.map(d => d.comunicacion)) },
    { area: 'Social', val: avg(...datos.map(d => d.social)) },
    { area: 'Académico', val: avg(...datos.map(d => d.academico)) },
    { area: 'Motora', val: avg(...datos.map(d => d.motora)) },
    { area: 'Autonomía', val: avg(...datos.map(d => d.autonomia)) },
  ].map(d => ({ ...d, val: d.val || 0 }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: '#64748b' }} />
        <Radar name="Promedio" dataKey="val" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
        <Tooltip formatter={v => [v?.toFixed(2), 'Puntaje']} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-bold text-slate-900">{p.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ProgresoPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [ninos, setNinos] = useState([])
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [ninoId, setNinoId]       = useState('todos')
  const [contexto, setContexto]   = useState('todos')   // escuela|casa|terapia|todos
  const [periodo, setPeriodo]     = useState('mes')      // semana|mes|todo
  const [agrupacion, setAgrupacion] = useState('semana') // dia|semana|mes
  const [areasVis, setAreasVis]   = useState(['regulacion_inicio','comunicacion','social','academico'])

  useEffect(() => { init() }, [])

  const init = async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)

    const [{ data: ninosPadre }, { data: equipoData }] = await Promise.all([
      supabase.from('ninos').select('*').eq('padre_id', u.id),
      supabase.from('equipo_terapeutico').select('ninos(*)').eq('usuario_id', u.id),
    ])
    const todos = [...(ninosPadre || []), ...(equipoData?.map(e => e.ninos) || [])]
    const unicos = todos.filter((n, i, s) => n && i === s.findIndex(x => x?.id === n.id))
    setNinos(unicos)

    if (unicos.length === 0) { setLoading(false); return }

    const { data: regs, error: regsError } = await supabase
      .from('registros_diarios')
      .select('*')
      .in('nino_id', unicos.map(n => n.id))
      .order('fecha', { ascending: true })

    if (regsError) console.error('Error registros:', regsError.message)

    setRegistros(regs || [])
    setLoading(false)
  }

  // Rango de fechas según periodo
  const fechaDesde = useMemo(() => {
    if (periodo === 'todo') return null
    const d = new Date()
    if (periodo === 'semana') d.setDate(d.getDate() - 7)
    if (periodo === 'mes')    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }, [periodo])

  // Filtrado y extracción de métricas
  const datosFiltrados = useMemo(() => {
    return registros
      .filter(r => ninoId   === 'todos' || r.nino_id === ninoId)
      .filter(r => contexto === 'todos' || r.tipo_registro === contexto)
      .filter(r => !fechaDesde || r.fecha >= fechaDesde)
      .map(extraerMetricas)
  }, [registros, ninoId, contexto, fechaDesde])

  const serieAgrupada = useMemo(() => agrupar(datosFiltrados, agrupacion), [datosFiltrados, agrupacion])

  // KPIs con tendencia (primera mitad vs segunda mitad)
  const kpis = useMemo(() => {
    if (!datosFiltrados.length) return {}
    const mid = Math.floor(datosFiltrados.length / 2)
    const primera = datosFiltrados.slice(0, mid)
    const segunda = datosFiltrados.slice(mid)
    const t = (key) => {
      const a = avg(...primera.map(d => d[key]))
      const b = avg(...segunda.map(d => d[key]))
      if (a === null || b === null) return null
      return +(b - a).toFixed(2)
    }
    return {
      regulacion: { val: avg(...datosFiltrados.map(d => avg(d.regulacion_inicio, d.regulacion_fin))), tend: t('regulacion_fin') },
      comunicacion: { val: avg(...datosFiltrados.map(d => d.comunicacion)), tend: t('comunicacion') },
      social: { val: avg(...datosFiltrados.map(d => d.social)), tend: t('social') },
      academico: { val: avg(...datosFiltrados.map(d => d.academico)), tend: t('academico') },
      motora: { val: avg(...datosFiltrados.map(d => d.motora)), tend: t('motora') },
      autonomia: { val: avg(...datosFiltrados.map(d => d.autonomia)), tend: t('autonomia') },
    }
  }, [datosFiltrados])

  // ── Generador de prompt ──────────────────────────────────────────────────
  const [copiado, setCopiado] = useState(false)
  const [analisisIA, setAnalisisIA] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [mostrarAnalisis, setMostrarAnalisis] = useState(false)

  const generarPrompt = () => {
    if (!datosFiltrados.length) return ''
    const nino = ninos.find(n => n.id === ninoId) || null
    const nombreNino = nino ? `${nino.nombre} ${nino.apellido}` : 'el niño'
    const periodoLabel = periodo === 'semana' ? 'última semana' : periodo === 'mes' ? 'último mes' : 'todo el historial'
    const contextoLabel = contexto === 'todos' ? 'escuela, casa y terapia' : CONTEXTO_TIPO[contexto]?.label || contexto

    const fmt = (v) => v !== null && v !== undefined ? v.toFixed(2) : 'sin datos'
    const k = kpis

    const conductaTotal = datosFiltrados.filter(d => d.conducta_freq > 0).length
    const conductaAvg = avg(...datosFiltrados.map(d => d.conducta_freq))
    const contextoPct = (flag) => {
      const pct = Math.round((datosFiltrados.filter(d => d.contexto[flag]).length / datosFiltrados.length) * 100)
      return `${pct}%`
    }

    return `Eres un psicólogo especialista en neurodivergencia (TEA, TDAH, y condiciones relacionadas). Analiza los siguientes datos clínicos de seguimiento de ${nombreNino} correspondientes al periodo: ${periodoLabel}, contexto: ${contextoLabel}. Total de registros analizados: ${datosFiltrados.length}.

## MÉTRICAS PROMEDIO (escala 1–5, donde 5 es óptimo)

- Regulación emocional: ${fmt(k.regulacion?.val)} ${k.regulacion?.tend > 0 ? '↑ mejorando' : k.regulacion?.tend < 0 ? '↓ bajando' : '→ estable'}
- Comunicación y lenguaje: ${fmt(k.comunicacion?.val)} ${k.comunicacion?.tend > 0 ? '↑ mejorando' : k.comunicacion?.tend < 0 ? '↓ bajando' : '→ estable'}
- Habilidades sociales: ${fmt(k.social?.val)} ${k.social?.tend > 0 ? '↑ mejorando' : k.social?.tend < 0 ? '↓ bajando' : '→ estable'}
- Habilidades académicas/cognitivas: ${fmt(k.academico?.val)} ${k.academico?.tend > 0 ? '↑ mejorando' : k.academico?.tend < 0 ? '↓ bajando' : '→ estable'}
- Habilidades motoras: ${fmt(k.motora?.val)} ${k.motora?.tend > 0 ? '↑ mejorando' : k.motora?.tend < 0 ? '↓ bajando' : '→ estable'}
- Autonomía / vida diaria: ${fmt(k.autonomia?.val)} ${k.autonomia?.tend > 0 ? '↑ mejorando' : k.autonomia?.tend < 0 ? '↓ bajando' : '→ estable'}

## CONDUCTA

- Días con conductas disruptivas: ${conductaTotal} de ${datosFiltrados.length} (${Math.round(conductaTotal/datosFiltrados.length*100)}%)
- Frecuencia promedio de disruptivas: ${fmt(conductaAvg)} (escala 0=nunca, 3=frecuente)

## CONTEXTO DEL DÍA (% de días con el factor presente)

- Durmió bien: ${contextoPct('durmio_bien')}
- Comió bien: ${contextoPct('comio_bien')}
- Tomó medicamento: ${contextoPct('tomo_medicamento')}
- Hubo cambio de rutina: ${contextoPct('cambio_rutina')}
- Evento estresante: ${contextoPct('evento_estresante')}

## EVOLUCIÓN POR SEMANA/PERIODO

${serieAgrupada.map(s =>
  `${s.label}: regulación=${fmt(s.regulacion_fin)}, comunicación=${fmt(s.comunicacion)}, social=${fmt(s.social)}, académico=${fmt(s.academico)}, conducta_freq=${fmt(s.conducta_freq)}`
).join('\n')}

## SOLICITUD

Con base en estos datos:
1. Identifica las áreas de mayor fortaleza y las que requieren más atención.
2. Señala patrones importantes (ej. correlación entre contexto y regulación, días críticos, tendencias).
3. Proporciona 3 a 5 estrategias concretas y basadas en evidencia que el equipo (padres, maestra sombra, terapeuta) puede implementar en las próximas semanas.
4. Redacta un párrafo breve de resumen ejecutivo del periodo, apto para compartir con otros profesionales o médicos.
5. Si detectas algo que requiere atención urgente, menciónalo claramente.

Responde en español, con lenguaje accesible para padres pero también técnico para profesionales.`
  }

  const analizarConIA = async () => {
    const prompt = generarPrompt()
    if (!prompt) return
    setLoadingIA(true)
    setAnalisisIA('')
    setMostrarAnalisis(true)

    try {
      const res = await fetch('/api/analizar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      setAnalisisIA(data.texto || 'Sin respuesta.')
    } catch (err) {
      setAnalisisIA('Error al conectar con la IA. Intenta de nuevo.')
    } finally {
      setLoadingIA(false)
    }
  }

  const copiarPrompt = async () => {
    const prompt = generarPrompt()
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const toggleArea = (key) =>
    setAreasVis(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500 animate-pulse">Cargando reportes...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Reportes de progreso</h1>
          <p className="text-slate-500 mt-1">Métricas clínicas visualizadas para todo el equipo</p>
        </div>

        {/* ── Filtros ── */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Niño</label>
              <select value={ninoId} onChange={e => setNinoId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="todos">Todos</option>
                {ninos.map(n => <option key={n.id} value={n.id}>{n.nombre} {n.apellido}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Contexto</label>
              <div className="flex gap-1.5">
                {[['todos','🔍 Todos'],['escuela','🏫 Escuela'],['casa','🏠 Casa'],['terapia','🧩 Terapia']].map(([v,l]) => (
                  <button key={v} onClick={() => setContexto(v)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      contexto === v ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Periodo</label>
              <div className="flex gap-1.5">
                {[['semana','Semana'],['mes','Mes'],['todo','Todo']].map(([v,l]) => (
                  <button key={v} onClick={() => setPeriodo(v)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      periodo === v ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Agrupar por</label>
              <div className="flex gap-1.5">
                {[['dia','Día'],['semana','Semana'],['mes','Mes']].map(([v,l]) => (
                  <button key={v} onClick={() => setAgrupacion(v)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      agrupacion === v ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="ml-auto text-sm text-slate-500 self-end pb-2">
              <Filter className="w-4 h-4 inline mr-1" />{datosFiltrados.length} registros
            </div>
          </div>
        </Card>

        {datosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">Sin registros para este filtro</p>
            <Link href="/registro-diario" className="mt-3 inline-block text-primary-600 text-sm hover:underline">
              Crear primer registro →
            </Link>
          </div>
        ) : (
          <>
            {/* ── Análisis IA ── */}
            <div className="mb-5">
                              <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-5 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Analizar con IA</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Genera un análisis clínico con estrategias concretas basado en los datos del periodo seleccionado.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={copiarPrompt}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                          copiado ? 'bg-green-500 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'
                        }`}>
                        {copiado ? <><Check className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar prompt</>}
                      </button>
                      <button onClick={analizarConIA} disabled={loadingIA}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all disabled:opacity-60">
                        {loadingIA
                          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analizando...</>
                          : <><Bot className="w-4 h-4" />Analizar ahora</>}
                      </button>
                    </div>
                  </div>

                  {/* Resultado IA */}
                  {mostrarAnalisis && (
                    <div className="bg-white rounded-xl border border-primary-100 p-4">
                      {loadingIA ? (
                        <div className="flex items-center gap-3 text-slate-500 text-sm py-4 justify-center">
                          <span className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                          Generando análisis clínico...
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none text-slate-700 text-sm leading-relaxed
                          [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-2 [&_h1]:mt-4
                          [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mb-2 [&_h2]:mt-4
                          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:mb-1 [&_h3]:mt-3
                          [&_p]:mb-2 [&_p]:leading-relaxed
                          [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:space-y-1
                          [&_ol]:pl-4 [&_ol]:mb-2 [&_ol]:space-y-1
                          [&_li]:text-slate-700
                          [&_strong]:font-semibold [&_strong]:text-slate-900
                          [&_em]:italic [&_em]:text-slate-600
                          [&_hr]:border-slate-200 [&_hr]:my-3
                          [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600">
                          <ReactMarkdown>{analisisIA}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <KPICard label="Regulación"   emoji="🧘" color="#6366f1" valor={kpis.regulacion?.val}   tendencia={kpis.regulacion?.tend} />
              <KPICard label="Comunicación" emoji="💬" color="#22c55e" valor={kpis.comunicacion?.val} tendencia={kpis.comunicacion?.tend} />
              <KPICard label="Social"       emoji="🤝" color="#f59e0b" valor={kpis.social?.val}       tendencia={kpis.social?.tend} />
              <KPICard label="Académico"    emoji="📚" color="#ef4444" valor={kpis.academico?.val}    tendencia={kpis.academico?.tend} />
              <KPICard label="Motora"       emoji="🏃" color="#14b8a6" valor={kpis.motora?.val}       tendencia={kpis.motora?.tend} />
              <KPICard label="Autonomía"    emoji="⭐" color="#f97316" valor={kpis.autonomia?.val}    tendencia={kpis.autonomia?.tend} />
            </div>

            {/* ── Radar + Contexto ── */}
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Perfil global de áreas</CardTitle>
                  <CardDescription>Promedio de todas las áreas en el periodo</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadarArea datos={datosFiltrados} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contexto del día</CardTitle>
                  <CardDescription>% de días en que cada factor estuvo presente</CardDescription>
                </CardHeader>
                <CardContent>
                  <ContextoHeatmap datos={datosFiltrados} />
                </CardContent>
              </Card>
            </div>

            {/* ── Líneas de tendencia ── */}
            <Card className="mb-5">
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base">Tendencia por área</CardTitle>
                    <CardDescription>Evolución en el tiempo — escala 1 a 5</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AREAS.filter(a => a.key !== 'apoyo').map(a => (
                      <button key={a.key} onClick={() => toggleArea(a.key)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          areasVis.includes(a.key)
                            ? 'text-white border-transparent'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                        style={areasVis.includes(a.key) ? { backgroundColor: a.color, borderColor: a.color } : {}}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={serieAgrupada} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {AREAS.filter(a => areasVis.includes(a.key)).map(a => (
                      <Line key={a.key} type="monotone" dataKey={a.key} name={a.label}
                        stroke={a.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }}
                        connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── Conducta + Registros por contexto ── */}
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conductas disruptivas</CardTitle>
                  <CardDescription>Frecuencia promedio (0=nunca · 3=frecuente)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={serieAgrupada} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 3]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="conducta_freq" name="Frecuencia disruptiva" fill="#ef4444" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Regulación: inicio vs fin del día</CardTitle>
                  <CardDescription>¿El niño termina mejor de lo que empieza?</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={serieAgrupada} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="regulacion_inicio" name="Inicio" stroke="#a5b4fc" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="regulacion_fin"    name="Fin"   stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Distribución de registros por contexto ── */}
            <Card className="mb-5">
              <CardHeader>
                <CardTitle className="text-base">Distribución de registros</CardTitle>
                <CardDescription>Cantidad de registros por periodo y contexto</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const porContexto = {}
                  datosFiltrados.forEach(d => {
                    const key = agrupacion === 'semana' ? semanaISO(d.fecha)
                              : agrupacion === 'mes'    ? mesLabel(d.fecha)
                              : diaLabel(d.fecha)
                    if (!porContexto[key]) porContexto[key] = { label: key, escuela: 0, casa: 0, terapia: 0 }
                    porContexto[key][d.tipo] = (porContexto[key][d.tipo] || 0) + 1
                  })
                  const data = Object.values(porContexto)
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="escuela" name="Escuela" stackId="a" fill="#6366f1" radius={[0,0,0,0]} />
                        <Bar dataKey="casa"    name="Casa"    stackId="a" fill="#22c55e" />
                        <Bar dataKey="terapia" name="Terapia" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </CardContent>
            </Card>

            {/* ── Tabla resumen ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen por periodo</CardTitle>
                <CardDescription>Promedios de todas las métricas agrupadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">Periodo</th>
                        <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">N</th>
                        {AREAS.map(a => (
                          <th key={a.key} className="text-center py-2 px-2 text-xs font-semibold" style={{ color: a.color }}>
                            {a.label.split(' ')[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {serieAgrupada.map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-2 pr-4 font-medium text-slate-700">{row.label}</td>
                          <td className="py-2 px-2 text-center text-slate-400">{row.n}</td>
                          {AREAS.map(a => {
                            const v = row[a.key]
                            const isApoyo = a.key === 'apoyo'
                            const bg = v === null ? '' :
                              v >= 4   ? 'bg-green-50 text-green-700' :
                              v >= 3   ? 'bg-yellow-50 text-yellow-700' :
                              'bg-red-50 text-red-600'
                            return (
                              <td key={a.key} className="py-2 px-2 text-center">
                                {v !== null ? (
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${bg}`}>
                                    {v.toFixed(1)}
                                  </span>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}