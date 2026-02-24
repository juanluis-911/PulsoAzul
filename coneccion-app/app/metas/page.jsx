'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import {
  Target, Plus, CheckCircle2, Clock, PauseCircle, XCircle,
  Pencil, Trash2, TrendingUp, ChevronRight, Sparkles, Flag
} from 'lucide-react'
import Link from 'next/link'

// ─── Constantes ───────────────────────────────────────────────────────────────

const AREAS = [
  { key: 'regulacion',   label: 'Regulación',   emoji: '🧘', hex: '#6366f1', bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  { key: 'comunicacion', label: 'Comunicación', emoji: '💬', hex: '#22c55e', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { key: 'social',       label: 'Social',       emoji: '🤝', hex: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  { key: 'academico',    label: 'Académico',    emoji: '📚', hex: '#ef4444', bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  { key: 'motora',       label: 'Motora',       emoji: '🏃', hex: '#14b8a6', bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200' },
  { key: 'autonomia',    label: 'Autonomía',    emoji: '⭐', hex: '#f97316', bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
]
const AREA_MAP = Object.fromEntries(AREAS.map(a => [a.key, a]))

const ESTADOS = [
  { key: 'activa',     label: 'Activa',     Icon: Clock,        cls: 'text-blue-600 bg-blue-50 border-blue-200' },
  { key: 'lograda',    label: 'Lograda',    Icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'pausada',    label: 'Pausada',    Icon: PauseCircle,  cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'descartada', label: 'Descartada', Icon: XCircle,      cls: 'text-slate-400 bg-slate-50 border-slate-200' },
]
const ESTADO_MAP = Object.fromEntries(ESTADOS.map(e => [e.key, e]))

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtFecha = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const diasRestantes = d => {
  if (!d) return null
  return Math.ceil((new Date(d + 'T12:00:00') - new Date()) / 86400000)
}

// ─── Anillo de progreso SVG ───────────────────────────────────────────────────
function RingProgress({ pct = 0, color = '#6366f1', size = 56, stroke = 5 }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s ease' }} />
    </svg>
  )
}

// ─── Chip área ────────────────────────────────────────────────────────────────
function ChipArea({ areaKey, small }) {
  const a = AREA_MAP[areaKey] || { label: areaKey, emoji: '•', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${a.bg} ${a.text} ${a.border} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
      {a.emoji} {a.label}
    </span>
  )
}

// ─── Chip estado ─────────────────────────────────────────────────────────────
function ChipEstado({ estadoKey, small }) {
  const e = ESTADO_MAP[estadoKey] || ESTADO_MAP.activa
  const { Icon } = e
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${e.cls} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
      <Icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} /> {e.label}
    </span>
  )
}

// ─── Avatar inicial ───────────────────────────────────────────────────────────
function AvatarInicial({ nombre, size = 'w-7 h-7 text-xs' }) {
  const ini = nombre?.charAt(0)?.toUpperCase() || '?'
  const cols = ['bg-sky-100 text-sky-700','bg-violet-100 text-violet-700','bg-emerald-100 text-emerald-700','bg-rose-100 text-rose-700','bg-amber-100 text-amber-700']
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${size} ${cols[ini.charCodeAt(0) % cols.length]}`}>
      {ini}
    </span>
  )
}

// ─── Tarjeta de meta ──────────────────────────────────────────────────────────
function MetaCard({ meta, ninos, onSelect, onLograda }) {
  const a = AREA_MAP[meta.area] || AREA_MAP.regulacion
  const nino = ninos.find(n => n.id === meta.nino_id)
  const pct = meta.progreso ?? 0
  const dias = diasRestantes(meta.fecha_objetivo)
  const vencida = dias !== null && dias < 0 && meta.estado === 'activa'
  const lograda = meta.estado === 'lograda'

  return (
    <div onClick={() => onSelect(meta)}
      className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-lg
                  transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99]
                  ${lograda ? 'border-emerald-200' : 'border-slate-100 hover:border-primary-100'}`}>

      {/* Franja de color superior por área */}
      <div className="h-1 w-full" style={{ backgroundColor: a.hex }} />

      {/* Confetti de fondo si lograda */}
      {lograda && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      )}

      <div className="p-4">
        {/* Header: chips + anillo */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            <ChipArea areaKey={meta.area} small />
            <ChipEstado estadoKey={meta.estado} small />
            {vencida && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                ⚠️ Vencida
              </span>
            )}
          </div>
          {/* Anillo */}
          <div className="relative shrink-0">
            <RingProgress pct={pct} color={lograda ? '#22c55e' : a.hex} size={48} stroke={4} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
              {pct}%
            </span>
          </div>
        </div>

        {/* Título */}
        <p className="font-semibold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">
          {meta.titulo}
        </p>

        {/* Niño */}
        {nino && (
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
            <span>👦</span> {nino.nombre} {nino.apellido}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`text-xs ${vencida ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
            {!meta.fecha_objetivo ? 'Sin fecha límite'
              : dias === 0 ? '🔔 Vence hoy'
              : dias > 0 ? `⏳ ${dias}d restante${dias !== 1 ? 's' : ''}`
              : `Venció hace ${Math.abs(dias)}d`}
          </span>
          {meta.estado === 'activa' && pct >= 100 ? (
            <button onClick={e => { e.stopPropagation(); onLograda(meta.id) }}
              className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200
                         px-2 py-1 rounded-full hover:bg-emerald-100 transition-colors flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Marcar lograda
            </button>
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-400 transition-colors" />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal detalle ────────────────────────────────────────────────────────────
function MetaModal({ meta, ninos, rol, onClose, onUpdate, onDelete }) {
  const [progreso, setProgreso] = useState(meta.progreso ?? 0)
  const [nota, setNota]         = useState('')
  const [actus, setActus]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [loadingA, setLoadingA] = useState(true)
  const nino  = ninos.find(n => n.id === meta.nino_id)
  const area  = AREA_MAP[meta.area] || AREA_MAP.regulacion
  const puedeEditar = ['padre','terapeuta','maestra_sombra'].includes(rol)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    fetchActus()
    const fn = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', fn) }
  }, [])

  const fetchActus = async () => {
    const sb = createClient()
    const { data } = await sb.from('metas_actualizaciones')
      .select('*, perfiles(nombre_completo, rol_principal)')
      .eq('meta_id', meta.id).order('created_at', { ascending: false })
    setActus(data || [])
    setLoadingA(false)
  }

  const guardar = async () => {
    if (!nota.trim()) return
    setLoading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    await sb.from('metas_actualizaciones').insert({ meta_id: meta.id, progreso_nuevo: progreso, nota: nota.trim(), creado_por: user.id })
    const upd = { progreso }
    if (progreso >= 100) upd.estado = 'lograda'
    await sb.from('metas').update(upd).eq('id', meta.id)
    setNota(''); fetchActus(); onUpdate(); setLoading(false)
  }

  const cambiarEstado = async (e) => {
    const sb = createClient()
    await sb.from('metas').update({ estado: e }).eq('id', meta.id)
    onUpdate(); onClose()
  }

  const eliminar = async () => {
    if (!confirm('¿Eliminar esta meta?')) return
    const sb = createClient()
    await sb.from('metas').delete().eq('id', meta.id)
    onDelete(); onClose()
  }

  const rolLabel = r => ({ padre: 'Padre/Madre', maestra_sombra: 'Maestra', terapeuta: 'Terapeuta' }[r] || r)
  const lograda = meta.estado === 'lograda'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* ── Hero del modal ── */}
        <div className="relative rounded-t-3xl sm:rounded-t-3xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${area.hex}18, ${area.hex}08)` }}>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex flex-wrap gap-1.5">
                <ChipArea areaKey={meta.area} />
                <ChipEstado estadoKey={meta.estado} />
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <h2 className="font-bold text-slate-900 text-lg leading-snug mb-1">{meta.titulo}</h2>
            {nino && <p className="text-sm text-slate-500">👦 {nino.nombre} {nino.apellido}</p>}

            {/* Anillo grande + % */}
            <div className="flex items-center gap-4 mt-4">
              <div className="relative">
                <RingProgress pct={meta.progreso ?? 0} color={lograda ? '#22c55e' : area.hex} size={72} stroke={6} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold text-slate-800">{meta.progreso ?? 0}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Progreso actual</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {meta.fecha_objetivo ? `Meta: ${fmtFecha(meta.fecha_objetivo)}` : 'Sin fecha límite'}
                </p>
                {meta.fecha_inicio && <p className="text-xs text-slate-400">Desde {fmtFecha(meta.fecha_inicio)}</p>}
              </div>
            </div>

            {/* Celebración lograda */}
            {lograda && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-sm font-bold text-emerald-700">¡Meta lograda!</p>
                  <p className="text-xs text-emerald-600">El equipo lo hizo posible juntos.</p>
                </div>
              </div>
            )}
          </div>
          {/* Borde inferior decorativo */}
          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${area.hex}40, transparent)` }} />
        </div>

        {/* ── Cuerpo scrollable ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Descripción */}
          {meta.descripcion && (
            <div className="bg-slate-50 rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Descripción</p>
              <p className="text-sm text-slate-700 leading-relaxed">{meta.descripcion}</p>
            </div>
          )}

          {/* Actualizar progreso */}
          {puedeEditar && meta.estado === 'activa' && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Registrar avance</p>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-slate-500">Nuevo progreso</span>
                    <span className="text-sm font-bold" style={{ color: area.hex }}>{progreso}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={progreso}
                    onChange={e => setProgreso(+e.target.value)}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: area.hex }} />
                  {/* Mini barra de preview */}
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progreso}%`, backgroundColor: area.hex }} />
                  </div>
                </div>
                <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2}
                  placeholder="Ej: Hoy lo logró con apoyo mínimo en grupo pequeño…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                             focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none bg-white" />
                <Button onClick={guardar} disabled={loading || !nota.trim()} className="w-full gap-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '💾'}
                  {loading ? 'Guardando…' : 'Guardar avance'}
                </Button>
              </div>
            </div>
          )}

          {/* Bitácora */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bitácora del equipo</p>
            {loadingA ? (
              <div className="flex justify-center py-4">
                <span className="w-5 h-5 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : actus.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Aún no hay actualizaciones registradas.</p>
            ) : (
              <div className="space-y-3">
                {actus.map(a => (
                  <div key={a.id} className="flex gap-2.5">
                    <AvatarInicial nombre={a.perfiles?.nombre_completo} />
                    <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">
                          {a.perfiles?.nombre_completo || 'Equipo'}
                          <span className="font-normal text-slate-400"> · {rolLabel(a.perfiles?.rol_principal)}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(a.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{a.nota}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${a.progreso_nuevo}%`, backgroundColor: area.hex }} />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">{a.progreso_nuevo}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones de estado */}
          {puedeEditar && (
            <div className="space-y-2">
              {meta.estado === 'activa' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => cambiarEstado('pausada')}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600
                               border border-amber-200 bg-amber-50 rounded-xl py-2.5 hover:bg-amber-100 transition-colors">
                    <PauseCircle className="w-3.5 h-3.5" /> Pausar meta
                  </button>
                  <button onClick={() => cambiarEstado('lograda')}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600
                               border border-emerald-200 bg-emerald-50 rounded-xl py-2.5 hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Marcar lograda
                  </button>
                </div>
              )}
              {meta.estado === 'pausada' && (
                <button onClick={() => cambiarEstado('activa')}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600
                             border border-blue-200 bg-blue-50 rounded-xl py-2.5 hover:bg-blue-100 transition-colors">
                  <Clock className="w-3.5 h-3.5" /> Reactivar meta
                </button>
              )}
              {rol === 'padre' && (
                <button onClick={eliminar}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400
                             hover:text-red-600 py-2 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar meta
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal nueva meta ─────────────────────────────────────────────────────────
function NuevaMetaModal({ ninos, onClose, onCreated }) {
  const [step, setStep]   = useState(1) // 1=área, 2=detalle
  const [form, setForm]   = useState({ nino_id: ninos.length === 1 ? ninos[0].id : '', area: '', titulo: '', descripcion: '', fecha_objetivo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.nino_id || !form.area || !form.titulo.trim()) { setError('Completa los campos obligatorios.'); return }
    setLoading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { error: err } = await sb.from('metas').insert({
      nino_id: form.nino_id, area: form.area, titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null, fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_objetivo: form.fecha_objetivo || null, estado: 'activa', progreso: 0, creado_por: user.id,
    })
    if (err) { setError(err.message); setLoading(false); return }
    onCreated(); onClose()
  }

  const areaSeleccionada = AREA_MAP[form.area]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors mr-1">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <div>
              <h2 className="font-bold text-slate-900 text-base">Nueva meta</h2>
              <p className="text-xs text-slate-400">{step === 1 ? 'Paso 1: elige el área de desarrollo' : 'Paso 2: define los detalles'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="flex gap-1.5 px-5 pt-3">
          {[1,2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-primary-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="px-5 py-4">
          {/* Paso 1: área */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">¿En qué área de desarrollo se enfoca esta meta?</p>
              <div className="grid grid-cols-3 gap-2">
                {AREAS.map(a => (
                  <button key={a.key} onClick={() => { set('area', a.key); setStep(2) }}
                    className={`rounded-2xl border-2 py-3 text-xs font-semibold transition-all flex flex-col items-center gap-1.5
                      hover:shadow-md active:scale-95 ${a.bg} ${a.text} ${a.border}`}>
                    <span className="text-2xl">{a.emoji}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: detalle */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Área seleccionada */}
              {areaSeleccionada && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${areaSeleccionada.bg} border ${areaSeleccionada.border}`}>
                  <span className="text-lg">{areaSeleccionada.emoji}</span>
                  <span className={`text-sm font-semibold ${areaSeleccionada.text}`}>{areaSeleccionada.label}</span>
                </div>
              )}

              {/* Niño (si hay más de uno) */}
              {ninos.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Niño *</label>
                  <select value={form.nino_id} onChange={e => set('nino_id', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                               focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                    <option value="">Selecciona un niño</option>
                    {ninos.map(n => <option key={n.id} value={n.id}>{n.nombre} {n.apellido}</option>)}
                  </select>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título de la meta *</label>
                <input value={form.titulo} onChange={e => set('titulo', e.target.value)}
                  placeholder="Ej: Esperar turnos en conversación grupal"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                             focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Descripción <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                  rows={2} placeholder="¿En qué contexto? ¿Qué significa lograrlo?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                             focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Fecha objetivo <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input type="date" value={form.fecha_objetivo} onChange={e => set('fecha_objetivo', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                             focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>

              {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

              <Button onClick={guardar} disabled={loading || !form.titulo.trim()} className="w-full gap-2 mt-1">
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Target className="w-4 h-4" />}
                {loading ? 'Guardando…' : 'Crear meta'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MetasPage() {
  const router = useRouter()
  const [user, setUser]   = useState(null)
  const [rol, setRol]     = useState('padre')
  const [ninos, setNinos] = useState([])
  const [metas, setMetas] = useState([])
  const [loading, setLoading] = useState(true)

  const [filtroEstado, setFiltroEstado] = useState('activa')
  const [filtroNino, setFiltroNino]     = useState('todos')
  const [metaSel, setMetaSel]           = useState(null)
  const [mostrarNueva, setMostrarNueva] = useState(false)

  useEffect(() => { init() }, [])

  const init = async () => {
    const sb = createClient()
    const { data: { user: u } } = await sb.auth.getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)

    const { data: perfil } = await sb.from('perfiles').select('rol_principal').eq('id', u.id).maybeSingle()
    const r = perfil?.rol_principal || 'padre'
    setRol(r)

    let nd = []
    if (r === 'padre') {
      const { data } = await sb.from('ninos').select('*').eq('padre_id', u.id)
      nd = data || []
    } else {
      const { data } = await sb.from('equipo_terapeutico').select('ninos(*)').eq('usuario_id', u.id)
      nd = data?.map(e => e.ninos).filter(Boolean) || []
    }
    setNinos(nd)
    await fetchMetas(nd)
    setLoading(false)
  }

  const fetchMetas = async (nd) => {
    if (!nd?.length) { setMetas([]); return }
    const sb = createClient()
    const { data } = await sb.from('metas').select('*')
      .in('nino_id', nd.map(n => n.id)).order('created_at', { ascending: false })
    setMetas(data || [])
  }

  const refresh = () => fetchMetas(ninos)

  const marcarLograda = async (id) => {
    const sb = createClient()
    await sb.from('metas').update({ estado: 'lograda', progreso: 100 }).eq('id', id)
    refresh()
  }

  const metasFiltradas = useMemo(() => metas.filter(m => {
    if (filtroEstado !== 'todos' && m.estado !== filtroEstado) return false
    if (filtroNino !== 'todos' && m.nino_id !== filtroNino) return false
    return true
  }), [metas, filtroEstado, filtroNino])

  const cnt = useMemo(() => ({
    activa: metas.filter(m => m.estado === 'activa').length,
    lograda: metas.filter(m => m.estado === 'lograda').length,
    pausada: metas.filter(m => m.estado === 'pausada').length,
  }), [metas])

  const pctGlobal = useMemo(() => {
    const activas = metas.filter(m => m.estado === 'activa')
    if (!activas.length) return 0
    return Math.round(activas.reduce((s, m) => s + (m.progreso ?? 0), 0) / activas.length)
  }, [metas])

  const puedeCrear = ['padre','terapeuta'].includes(rol)

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      {user && <Navbar user={user} />}
      <main className="flex-1 flex items-center justify-center pt-14 md:pt-0">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando metas…</p>
        </div>
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">

        {/* ── Hero con gradiente ── */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 px-4 pt-8 pb-16 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">Metas</span>
                </div>
                <h1 className="text-2xl font-bold text-white">Objetivos del equipo</h1>
                <p className="text-primary-100 text-sm mt-1">Seguimiento de metas terapéuticas y de desarrollo</p>
              </div>
              {puedeCrear && (
                <button onClick={() => setMostrarNueva(true)}
                  className="flex items-center gap-1.5 bg-white text-primary-600 font-semibold text-sm
                             px-4 py-2.5 rounded-2xl shadow-lg hover:shadow-xl hover:bg-primary-50
                             transition-all active:scale-95 shrink-0">
                  <Plus className="w-4 h-4" /> Nueva meta
                </button>
              )}
            </div>

            {/* Resumen inline en el hero */}
            {metas.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: 'Activas',  val: cnt.activa,  sub: `${pctGlobal}% promedio`, icon: '🎯' },
                  { label: 'Logradas', val: cnt.lograda, sub: 'objetivos alcanzados', icon: '🏆' },
                  { label: 'Pausadas', val: cnt.pausada, sub: 'en espera', icon: '⏸️' },
                ].map(s => (
                  <div key={s.label} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                    <p className="text-white font-bold text-xl">{s.val}</p>
                    <p className="text-white/90 text-xs font-semibold">{s.label}</p>
                    <p className="text-white/60 text-[10px] mt-0.5 leading-tight">{s.sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Contenido (sube sobre el hero) ── */}
        <div className="px-4 md:px-8 -mt-8 max-w-3xl mx-auto pb-10">

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 mb-4 flex flex-wrap gap-2">
            {[
              { key: 'activa',  label: '🎯 Activas',  n: cnt.activa },
              { key: 'lograda', label: '🏆 Logradas', n: cnt.lograda },
              { key: 'pausada', label: '⏸ Pausadas', n: cnt.pausada },
              { key: 'todos',   label: 'Todas',       n: metas.length },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltroEstado(f.key)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                  filtroEstado === f.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}>
                {f.label}
                {f.n > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    filtroEstado === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>{f.n}</span>
                )}
              </button>
            ))}
            {ninos.length > 1 && (
              <select value={filtroNino} onChange={e => setFiltroNino(e.target.value)}
                className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white
                           text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="todos">Todos</option>
                {ninos.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            )}
          </div>

          {/* Lista */}
          {ninos.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
              <p className="text-5xl mb-3">👦</p>
              <p className="font-semibold text-slate-700 mb-1">Primero agrega un niño</p>
              <p className="text-sm text-slate-400 mb-5">Las metas se asignan a un perfil de niño</p>
              <Link href="/nino/nuevo"><Button>Agregar niño</Button></Link>
            </div>
          ) : metasFiltradas.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
              <p className="text-5xl mb-3">🎯</p>
              <p className="font-semibold text-slate-700 mb-1">
                {filtroEstado === 'activa' ? 'No hay metas activas' : 'No hay metas en esta categoría'}
              </p>
              <p className="text-sm text-slate-400 mb-5">
                {filtroEstado === 'activa' ? 'Crea la primera meta del equipo para empezar a dar seguimiento.' : 'Prueba cambiando el filtro.'}
              </p>
              {puedeCrear && filtroEstado === 'activa' && (
                <Button onClick={() => setMostrarNueva(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Crear primera meta
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {metasFiltradas.map(m => (
                <MetaCard key={m.id} meta={m} ninos={ninos}
                  onSelect={setMetaSel} onLograda={marcarLograda} />
              ))}
            </div>
          )}

          {/* Link a Progreso */}
          {metas.length > 0 && (
            <Link href="/progreso"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold
                         text-primary-600 hover:text-primary-700 transition-colors">
              <TrendingUp className="w-4 h-4" /> Ver gráficas de progreso
            </Link>
          )}
        </div>
      </main>

      {metaSel && (
        <MetaModal meta={metaSel} ninos={ninos} rol={rol} onClose={() => setMetaSel(null)}
          onUpdate={() => { refresh(); setMetaSel(null) }} onDelete={refresh} />
      )}
      {mostrarNueva && (
        <NuevaMetaModal ninos={ninos} onClose={() => setMostrarNueva(false)} onCreated={refresh} />
      )}
    </div>
  )
}