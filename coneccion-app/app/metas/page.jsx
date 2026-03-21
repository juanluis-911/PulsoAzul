'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import {
  Target, Plus, CheckCircle2, Clock, PauseCircle, XCircle,
  Trash2, TrendingUp, ChevronRight, UserCheck, Lock, Pencil, LayoutGrid, Link2, Link2Off
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

const ROL_LABEL = { padre: 'Padre/Madre', maestra_sombra: 'Maestra', terapeuta: 'Terapeuta' }
const ROL_COLOR = {
  padre:          'bg-amber-100 text-amber-700',
  maestra_sombra: 'bg-blue-100 text-blue-700',
  terapeuta:      'bg-violet-100 text-violet-700',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtFecha = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const diasRestantes = d => {
  if (!d) return null
  return Math.ceil((new Date(d + 'T12:00:00') - new Date()) / 86400000)
}

// ─── Anillo SVG ───────────────────────────────────────────────────────────────
function RingProgress({ pct = 0, color = '#6366f1', size = 56, stroke = 5 }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .6s ease' }} />
    </svg>
  )
}

function ChipArea({ areaKey, small }) {
  const a = AREA_MAP[areaKey] || { label: areaKey, emoji: '•', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${a.bg} ${a.text} ${a.border} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
      {a.emoji} {a.label}
    </span>
  )
}

function ChipEstado({ estadoKey, small }) {
  const e = ESTADO_MAP[estadoKey] || ESTADO_MAP.activa
  const { Icon } = e
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${e.cls} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
      <Icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} /> {e.label}
    </span>
  )
}

function AvatarInicial({ nombre, size = 'w-7 h-7 text-xs' }) {
  const ini = nombre?.charAt(0)?.toUpperCase() || '?'
  const cols = ['bg-sky-100 text-sky-700','bg-violet-100 text-violet-700','bg-emerald-100 text-emerald-700','bg-rose-100 text-rose-700','bg-amber-100 text-amber-700']
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${size} ${cols[ini.charCodeAt(0) % cols.length]}`}>
      {ini}
    </span>
  )
}

// ─── Selector de responsables ─────────────────────────────────────────────────
function SelectorResponsables({ equipo, seleccionados, onChange }) {
  const toggle = uid => onChange(
    seleccionados.includes(uid) ? seleccionados.filter(id => id !== uid) : [...seleccionados, uid]
  )
  if (!equipo.length) return (
    <p className="text-xs text-slate-400 italic text-center py-3">No hay otros miembros en el equipo todavía.</p>
  )
  return (
    <div className="space-y-2">
      {equipo.map(m => {
        const sel = seleccionados.includes(m.usuario_id)
        return (
          <button key={m.usuario_id} onClick={() => toggle(m.usuario_id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border-2 transition-all text-left
              ${sel ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <AvatarInicial nombre={m.nombre} size="w-9 h-9 text-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{m.nombre}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROL_COLOR[m.rol] || 'bg-slate-100 text-slate-500'}`}>
                {ROL_LABEL[m.rol] || m.rol}
              </span>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
              ${sel ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`}>
              {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Modal editar meta ────────────────────────────────────────────────────────
function EditarMetaModal({ meta, equipo, onClose, onSaved }) {
  const [form, setForm] = useState({
    titulo:         meta.titulo || '',
    descripcion:    meta.descripcion || '',
    fecha_objetivo: meta.fecha_objetivo || '',
    area:           meta.area || '',
  })
  const [responsables, setResponsables] = useState(meta.responsables?.map(r => r.usuario_id) || [])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.titulo.trim()) { setError('El título es obligatorio.'); return }
    setLoading(true)
    const sb = createClient()

    await sb.from('metas').update({
      titulo:         form.titulo.trim(),
      descripcion:    form.descripcion.trim() || null,
      fecha_objetivo: form.fecha_objetivo || null,
      area:           form.area,
    }).eq('id', meta.id)

    // Reemplazar responsables: borrar todos y volver a insertar
    await sb.from('metas_responsables').delete().eq('meta_id', meta.id)
    if (responsables.length) {
      await sb.from('metas_responsables').insert(
        responsables.map(uid => ({ meta_id: meta.id, usuario_id: uid }))
      )
    }

    onSaved()
    onClose()
    setLoading(false)
  }

  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-base">Editar meta</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Área */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Área de desarrollo</label>
            <div className="grid grid-cols-3 gap-2">
              {AREAS.map(a => (
                <button key={a.key} onClick={() => set('area', a.key)}
                  className={`rounded-xl border-2 py-2 text-xs font-semibold transition-all flex flex-col items-center gap-1
                    ${form.area === a.key ? `${a.bg} ${a.text} ${a.border}` : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                  <span className="text-lg">{a.emoji}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título *</label>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Descripción <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Fecha objetivo <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input type="date" value={form.fecha_objetivo} onChange={e => set('fecha_objetivo', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>

          {/* Responsables */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Responsables
            </label>
            <SelectorResponsables equipo={equipo} seleccionados={responsables} onChange={setResponsables} />
            {responsables.length > 0 && (
              <div className="mt-2 bg-primary-50 border border-primary-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                <p className="text-xs text-primary-700 font-medium">
                  {responsables.length} responsable{responsables.length !== 1 ? 's' : ''} seleccionado{responsables.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-slate-100">
          <Button onClick={guardar} disabled={loading} className="w-full gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Pencil className="w-4 h-4" />}
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de meta ──────────────────────────────────────────────────────────
function MetaCard({ meta, ninos, onSelect, onLograda }) {
  const a     = AREA_MAP[meta.area] || AREA_MAP.regulacion
  const nino  = ninos.find(n => n.id === meta.nino_id)
  const pct   = meta.progreso ?? 0
  const dias  = diasRestantes(meta.fecha_objetivo)
  const vencida = dias !== null && dias < 0 && meta.estado === 'activa'
  const lograda = meta.estado === 'lograda'

  return (
    <div onClick={() => onSelect(meta)}
      className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-lg
                  transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99]
                  ${lograda ? 'border-emerald-200' : 'border-slate-100 hover:border-primary-100'}`}>
      <div className="h-1 w-full" style={{ backgroundColor: a.hex }} />
      {lograda && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      )}
      <div className="p-4">
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
          <div className="relative shrink-0">
            <RingProgress pct={pct} color={lograda ? '#22c55e' : a.hex} size={48} stroke={4} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">{pct}%</span>
          </div>
        </div>

        <p className="font-semibold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{meta.titulo}</p>
        {nino && <p className="text-xs text-slate-400 mb-3">👦 {nino.nombre} {nino.apellido}</p>}

        {/* Responsables en tarjeta */}
        {meta.responsables?.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Responsables
            </p>
            <div className="flex flex-wrap gap-1">
              {meta.responsables.map(r => (
                <span key={r.usuario_id} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                  <AvatarInicial nombre={r.nombre} size="w-3.5 h-3.5 text-[8px]" />
                  <span className="text-[10px] font-semibold text-slate-700">{r.nombre?.split(' ')[0]}</span>
                  <span className={`text-[9px] font-semibold px-1 rounded-full ${ROL_COLOR[r.rol] || 'bg-slate-100 text-slate-500'}`}>
                    {ROL_LABEL[r.rol] || r.rol}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
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
function MetaModal({ meta, ninos, equipo, userId, onClose, onUpdate, onDelete }) {
  const [progreso, setProgreso]       = useState(meta.progreso ?? 0)
  const [nota, setNota]               = useState('')
  const [actus, setActus]             = useState([])
  const [loading, setLoading]         = useState(false)
  const [loadingA, setLoadingA]       = useState(true)
  const [editando, setEditando]       = useState(false)
  // PECS
  const [pecsAsociados, setPecsAsociados]   = useState([])
  const [loadingPecs, setLoadingPecs]       = useState(true)
  const [showVincular, setShowVincular]     = useState(false)
  const [pecsSinMeta, setPecsSinMeta]       = useState([])
  const [loadingVincular, setLoadingVincular] = useState(false)

  const nino   = ninos.find(n => n.id === meta.nino_id)
  const area   = AREA_MAP[meta.area] || AREA_MAP.regulacion
  const lograda = meta.estado === 'lograda'

  // FIX: el creador siempre puede actualizar, además de los responsables asignados
  const esResponsable = meta.responsables?.some(r => r.usuario_id === userId)
  const esPadreOCreador = meta.creado_por === userId
  const puedeActualizar = (esResponsable || esPadreOCreador) && meta.estado === 'activa'
  const puedeEditar = meta.creado_por === userId || esResponsable

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    fetchActus()
    fetchPecsAsociados()
    const fn = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', fn) }
  }, [])

  const fetchActus = async () => {
    const sb = createClient()

    // FIX: mismo patrón — dos queries separadas para evitar el problema de RLS con joins de PostgREST
    const { data: actusData } = await sb.from('metas_actualizaciones')
      .select('*')
      .eq('meta_id', meta.id).order('created_at', { ascending: false })

    if (!actusData?.length) { setActus([]); setLoadingA(false); return }

    const uids = [...new Set(actusData.map(a => a.creado_por).filter(Boolean))]
    let perfilMap = {}
    if (uids.length) {
      const { data: perfilesData } = await sb
        .from('perfiles')
        .select('id, nombre_completo, rol_principal')
        .in('id', uids)
      perfilMap = Object.fromEntries((perfilesData || []).map(p => [p.id, p]))
    }

    const actusConPerfil = actusData.map(a => ({
      ...a,
      perfiles: perfilMap[a.creado_por] || null
    }))

    setActus(actusConPerfil)
    setLoadingA(false)
  }

  const fetchPecsAsociados = async () => {
    setLoadingPecs(true)
    const sb = createClient()
    const { data } = await sb
      .from('pecs_sets')
      .select('id, nombre, pictogram_ids, user_id')
      .eq('meta_id', meta.id)
      .order('created_at', { ascending: false })
    setPecsAsociados(data || [])
    setLoadingPecs(false)
  }

  const fetchPecsSinMeta = async () => {
    const sb = createClient()
    // Sin filtrar por user_id: la RLS controla qué sets ve cada usuario.
    // Incluimos meta_id para filtrar en JS (tolerante si la columna aún no existe).
    const { data: rows } = await sb
      .from('pecs_sets')
      .select('id, nombre, pictogram_ids, user_id, meta_id')
      .eq('nino_id', meta.nino_id)
      .order('created_at', { ascending: false })
    // Filtrar en JS: sin meta asignada o columna aún no existe
    const disponibles = (rows || []).filter(s => !s.meta_id)
    setPecsSinMeta(disponibles)
  }

  const vincularSet = async (setId) => {
    setLoadingVincular(true)
    await fetch('/api/pecs/sets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: setId, meta_id: meta.id }),
    })
    await fetchPecsAsociados()
    setPecsSinMeta(s => s.filter(p => p.id !== setId))
    setLoadingVincular(false)
  }

  const desvincularSet = async (setId) => {
    await fetch('/api/pecs/sets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: setId, meta_id: null }),
    })
    setPecsAsociados(s => s.filter(p => p.id !== setId))
  }

  const guardar = async () => {
    if (!nota.trim()) return
    setLoading(true)
    const sb = createClient()
    await sb.from('metas_actualizaciones').insert({
      meta_id: meta.id, progreso_nuevo: progreso, nota: nota.trim(), creado_por: userId
    })
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}>
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}>

          {/* Hero */}
          <div className="relative rounded-t-3xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${area.hex}18, ${area.hex}06)` }}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-1.5">
                  <ChipArea areaKey={meta.area} />
                  <ChipEstado estadoKey={meta.estado} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Botón editar */}
                  {puedeEditar && meta.estado !== 'lograda' && (
                    <button onClick={() => setEditando(true)}
                      className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-white transition-colors"
                      title="Editar meta">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h2 className="font-bold text-slate-900 text-lg leading-snug mb-1">{meta.titulo}</h2>
              {nino && <p className="text-sm text-slate-500">👦 {nino.nombre} {nino.apellido}</p>}

              <div className="flex items-center gap-4 mt-4">
                <div className="relative">
                  <RingProgress pct={meta.progreso ?? 0} color={lograda ? '#22c55e' : area.hex} size={72} stroke={6} />
                  <div className="absolute inset-0 flex items-center justify-center">
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
            <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${area.hex}40, transparent)` }} />
          </div>

          {/* Cuerpo */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

            {meta.descripcion && (
              <div className="bg-slate-50 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-slate-700 leading-relaxed">{meta.descripcion}</p>
              </div>
            )}

            {/* Responsables */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Responsables
              </p>
              {meta.responsables?.length ? (
                <div className="space-y-2">
                  {meta.responsables.map(r => (
                    <div key={r.usuario_id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2.5">
                      <AvatarInicial nombre={r.nombre} size="w-8 h-8 text-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.nombre}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROL_COLOR[r.rol] || 'bg-slate-100 text-slate-500'}`}>
                          {ROL_LABEL[r.rol] || r.rol}
                        </span>
                      </div>
                      {r.usuario_id === userId && (
                        <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
                          Tú
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <p className="text-xs text-amber-700">Esta meta no tiene responsables asignados. Edítala para asignar uno.</p>
                </div>
              )}
            </div>

            {/* Material PECS asociado */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" /> Material PECS
              </p>

              {loadingPecs ? (
                <div className="flex justify-center py-3">
                  <span className="w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : pecsAsociados.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs text-slate-400">Sin material PECS vinculado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pecsAsociados.map(set => (
                    <div key={set.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2.5">
                      <div className="flex gap-1 shrink-0">
                        {(set.pictogram_ids || []).slice(0, 4).map((p, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={p.imageUrl} alt={p.label}
                            className="w-8 h-8 rounded-lg object-contain border border-slate-100 bg-white" />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{set.nombre}</p>
                        <p className="text-xs text-slate-400">{(set.pictogram_ids || []).length} pictogramas</p>
                      </div>
                      {set.user_id === userId && (
                        <button onClick={() => desvincularSet(set.id)}
                          title="Desvincular"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                          <Link2Off className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Vincular set */}
              {puedeEditar && (
                showVincular ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-slate-500 font-medium">Tus sets disponibles para este niño:</p>
                    {loadingVincular ? (
                      <div className="flex justify-center py-2">
                        <span className="w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                      </div>
                    ) : pecsSinMeta.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-2">
                        No tienes sets sin vincular para este niño
                      </p>
                    ) : pecsSinMeta.map(set => (
                      <button key={set.id} onClick={() => vincularSet(set.id)}
                        className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2
                                   hover:border-primary-300 hover:bg-primary-50 text-left transition-colors">
                        <div className="flex gap-1 shrink-0">
                          {(set.pictogram_ids || []).slice(0, 3).map((p, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={p.imageUrl} alt={p.label}
                              className="w-7 h-7 rounded object-contain border border-slate-100 bg-white" />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{set.nombre}</p>
                          <p className="text-[10px] text-slate-400">{(set.pictogram_ids || []).length} pictogramas</p>
                        </div>
                        <Link2 className="w-4 h-4 text-primary-500 shrink-0" />
                      </button>
                    ))}
                    <button onClick={() => setShowVincular(false)}
                      className="text-xs text-slate-400 underline w-full text-center pt-1">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowVincular(true); fetchPecsSinMeta() }}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2
                               rounded-xl border border-dashed border-slate-300 text-xs text-slate-500
                               hover:border-primary-400 hover:text-primary-600 transition-colors">
                    <Link2 className="w-3.5 h-3.5" /> Vincular set PECS
                  </button>
                )
              )}
            </div>

            {/* Registrar avance */}
            {puedeActualizar ? (
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
            ) : meta.estado === 'activa' && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500 leading-snug">
                  Solo los <span className="font-semibold text-slate-700">responsables asignados</span> pueden registrar avances en esta meta.
                </p>
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
                            <span className="font-normal text-slate-400"> · {ROL_LABEL[a.perfiles?.rol_principal] || a.perfiles?.rol_principal}</span>
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
            {(esPadreOCreador || esResponsable) && (
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
                {esPadreOCreador && (
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

      {/* Modal de edición encima del detalle */}
      {editando && (
        <EditarMetaModal
          meta={meta}
          equipo={equipo}
          onClose={() => setEditando(false)}
          onSaved={() => { onUpdate(); onClose() }}
        />
      )}
    </>
  )
}

// ─── Modal nueva meta ─────────────────────────────────────────────────────────
function NuevaMetaModal({ ninos, equipo, userId, onClose, onCreated }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    nino_id: ninos.length === 1 ? ninos[0].id : '',
    area: '', titulo: '', descripcion: '', fecha_objetivo: '',
  })
  const [responsables, setResponsables] = useState([userId])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  // Paso 4 — PECS
  const [metaCreada, setMetaCreada]     = useState(null)
  const [pecsSets, setPecsSets]         = useState([])
  const [loadingPecs, setLoadingPecs]   = useState(false)
  const [vinculando, setVinculando]     = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const areaSeleccionada = AREA_MAP[form.area]

  const guardar = async () => {
    if (!form.nino_id || !form.area || !form.titulo.trim()) { setError('Completa los campos obligatorios.'); return }
    setLoading(true)
    const sb = createClient()

    const { data: meta, error: err } = await sb.from('metas').insert({
      nino_id:        form.nino_id,
      area:           form.area,
      titulo:         form.titulo.trim(),
      descripcion:    form.descripcion.trim() || null,
      fecha_inicio:   new Date().toISOString().split('T')[0],
      fecha_objetivo: form.fecha_objetivo || null,
      estado:         'activa',
      progreso:       0,
      creado_por:     userId,
    }).select().single()

    if (err) { setError(err.message); setLoading(false); return }

    if (responsables.length) {
      const { error: respErr } = await sb.from('metas_responsables').insert(
        responsables.map(uid => ({ meta_id: meta.id, usuario_id: uid }))
      )
      if (respErr) console.error('Error al insertar responsables:', respErr.message)
    }

    // Avanzar al paso 4 y cargar sets PECS disponibles
    setMetaCreada(meta)
    onCreated() // refrescar lista ya con la meta creada
    setLoadingPecs(true)
    const { data: setsData } = await sb
      .from('pecs_sets')
      .select('id, nombre, pictogram_ids, user_id, meta_id')
      .eq('nino_id', form.nino_id)
      .order('created_at', { ascending: false })
    setPecsSets((setsData || []).filter(s => !s.meta_id))
    setLoadingPecs(false)
    setLoading(false)
    setStep(4)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <div>
              <h2 className="font-bold text-slate-900 text-base">Nueva meta</h2>
              <p className="text-xs text-slate-400">
                {step === 1 ? 'Paso 1 · Área de desarrollo'
                  : step === 2 ? 'Paso 2 · Detalles de la meta'
                  : step === 3 ? 'Paso 3 · Responsables'
                  : 'Paso 4 · Material PECS (opcional)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1.5 px-5 pt-3 pb-1">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-primary-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">

          {/* Paso 1: Área */}
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

          {/* Paso 2: Detalle */}
          {step === 2 && (
            <div className="space-y-3">
              {areaSeleccionada && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${areaSeleccionada.bg} border ${areaSeleccionada.border}`}>
                  <span className="text-lg">{areaSeleccionada.emoji}</span>
                  <span className={`text-sm font-semibold ${areaSeleccionada.text}`}>{areaSeleccionada.label}</span>
                </div>
              )}
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título de la meta *</label>
                <input value={form.titulo} onChange={e => set('titulo', e.target.value)}
                  placeholder="Ej: Esperar turnos en conversación grupal"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                             focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Descripción <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                  rows={2} placeholder="¿En qué contexto? ¿Qué significa lograrlo?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700
                             focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
              </div>
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
              <Button onClick={() => { if (!form.titulo.trim()) { setError('El título es obligatorio.'); return }; setError(''); setStep(3) }}
                className="w-full gap-2">
                Siguiente · Asignar responsables <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Paso 3: Responsables */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-700 font-medium mb-1">¿Quién trabajará esta meta?</p>
                <p className="text-xs text-slate-400">Solo los responsables podrán registrar avances. Todos podrán verla.</p>
              </div>

              <SelectorResponsables equipo={equipo} seleccionados={responsables} onChange={setResponsables} />

              {responsables.length > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-2xl px-3 py-2.5 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary-500 shrink-0" />
                  <p className="text-xs text-primary-700 font-medium">
                    {responsables.length} responsable{responsables.length !== 1 ? 's' : ''} seleccionado{responsables.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

              <Button onClick={guardar} disabled={loading} className="w-full gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Target className="w-4 h-4" />}
                {loading ? 'Creando meta…' : 'Crear meta'}
              </Button>
            </div>
          )}

          {/* Paso 4: Vincular PECS (opcional) */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Confirmación de meta creada */}
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">¡Meta creada!</p>
                  <p className="text-xs text-emerald-600 mt-0.5 leading-snug">
                    ¿Quieres vincularle un set de PECS para apoyar esta meta?
                  </p>
                </div>
              </div>

              {loadingPecs ? (
                <div className="flex justify-center py-6">
                  <span className="w-5 h-5 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : pecsSets.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl px-4 py-5 text-center space-y-1">
                  <LayoutGrid className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500 font-medium">Sin sets disponibles</p>
                  <p className="text-xs text-slate-400 leading-snug">
                    Crea un set en Material → PECS asignado a este niño y luego vincúlalo desde la meta.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Sets disponibles para este niño
                  </p>
                  {pecsSets.map(s => (
                    <button
                      key={s.id}
                      disabled={!!vinculando}
                      onClick={async () => {
                        setVinculando(s.id)
                        await fetch('/api/pecs/sets', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: s.id, meta_id: metaCreada.id }),
                        })
                        onClose()
                      }}
                      className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-3 py-2.5
                                 hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-60 text-left"
                    >
                      <div className="flex gap-1 shrink-0">
                        {(s.pictogram_ids || []).slice(0, 4).map((p, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={p.imageUrl} alt={p.label}
                            className="w-9 h-9 rounded-lg object-contain border border-slate-100 bg-white" />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.nombre}</p>
                        <p className="text-xs text-slate-400">{(s.pictogram_ids || []).length} pictogramas</p>
                      </div>
                      {vinculando === s.id
                        ? <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin shrink-0" />
                        : <Link2 className="w-4 h-4 text-primary-400 shrink-0" />
                      }
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
              >
                Omitir por ahora
              </button>
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
  const [user, setUser]     = useState(null)
  const [rol, setRol]       = useState('padre')
  const [ninos, setNinos]   = useState([])
  const [equipo, setEquipo] = useState([])
  const [metas, setMetas]   = useState([])
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

    const { data: perfil } = await sb.from('perfiles').select('rol_principal, nombre_completo').eq('id', u.id).maybeSingle()
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

    // FIX: cargar equipo correctamente para todos los niños del usuario
    if (nd.length) {
      const ninoIds = nd.map(n => n.id)

      // Obtener todos los miembros del equipo de esos niños
      const { data: equipoRows } = await sb
        .from('equipo_terapeutico')
        .select('usuario_id, rol, nino_id')
        .in('nino_id', ninoIds)

      // Obtener perfiles de todos esos usuarios en una sola query
      const uids = [...new Set((equipoRows || []).map(e => e.usuario_id))]

      // Agregar el usuario actual si no está
      if (!uids.includes(u.id)) uids.push(u.id)

      const { data: perfilesData } = await sb
        .from('perfiles')
        .select('id, nombre_completo, rol_principal')
        .in('id', uids)

      const perfilMap = Object.fromEntries((perfilesData || []).map(p => [p.id, p]))

      // Construir lista de miembros únicos
      const vistos = new Set()
      const miembros = []

      // Siempre incluir al usuario actual primero
      const miPerfil = perfilMap[u.id]
      if (miPerfil) {
        miembros.push({ usuario_id: u.id, nombre: miPerfil.nombre_completo || 'Tú', rol: miPerfil.rol_principal || r })
        vistos.add(u.id)
      }

      // Agregar el resto
      for (const e of (equipoRows || [])) {
        if (!vistos.has(e.usuario_id)) {
          const p = perfilMap[e.usuario_id]
          miembros.push({ usuario_id: e.usuario_id, nombre: p?.nombre_completo || 'Miembro', rol: e.rol })
          vistos.add(e.usuario_id)
        }
      }

      setEquipo(miembros)
    }

    await fetchMetas(nd)
    setLoading(false)
  }

  const fetchMetas = async (nd) => {
    if (!nd?.length) { setMetas([]); return }
    const sb = createClient()

    const { data: metasData } = await sb.from('metas').select('*')
      .in('nino_id', nd.map(n => n.id)).order('created_at', { ascending: false })

    if (!metasData?.length) { setMetas([]); return }

    // FIX: dos queries separadas en lugar del join anidado de PostgREST
    // que falla con RLS al intentar leer perfiles de otros usuarios

    // Query 1: responsables (solo IDs)
    const metaIds = metasData.map(m => m.id)
    const { data: respData } = await sb
      .from('metas_responsables')
      .select('meta_id, usuario_id')
      .in('meta_id', metaIds)

    // Query 2: perfiles de esos usuarios directamente
    const uids = [...new Set((respData || []).map(r => r.usuario_id))]
    let perfilMap = {}
    if (uids.length) {
      const { data: perfilesData } = await sb
        .from('perfiles')
        .select('id, nombre_completo, rol_principal')
        .in('id', uids)
      perfilMap = Object.fromEntries((perfilesData || []).map(p => [p.id, p]))
    }

    // Combinar manualmente
    const metasConResp = metasData.map(m => ({
      ...m,
      responsables: (respData || [])
        .filter(r => r.meta_id === m.id)
        .map(r => ({
          usuario_id: r.usuario_id,
          nombre: perfilMap[r.usuario_id]?.nombre_completo || 'Miembro',
          rol:    perfilMap[r.usuario_id]?.rol_principal,
        }))
    }))

    setMetas(metasConResp)
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
    activa:  metas.filter(m => m.estado === 'activa').length,
    lograda: metas.filter(m => m.estado === 'lograda').length,
    pausada: metas.filter(m => m.estado === 'pausada').length,
  }), [metas])

  const pctGlobal = useMemo(() => {
    const activas = metas.filter(m => m.estado === 'activa')
    if (!activas.length) return 0
    return Math.round(activas.reduce((s, m) => s + (m.progreso ?? 0), 0) / activas.length)
  }, [metas])

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      {user && <Navbar user={user} />}
      <main className="flex-1 flex items-center justify-center pt-14 md:pt-0">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando metas…</p>
        </div>
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">

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
              <button onClick={() => setMostrarNueva(true)}
                className="flex items-center gap-1.5 bg-white text-primary-600 font-semibold text-sm
                           px-4 py-2.5 rounded-2xl shadow-lg hover:shadow-xl hover:bg-primary-50
                           transition-all active:scale-95 shrink-0">
                <Plus className="w-4 h-4" /> Nueva meta
              </button>
            </div>

            {metas.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: 'Activas',  val: cnt.activa,  sub: `${pctGlobal}% promedio` },
                  { label: 'Logradas', val: cnt.lograda, sub: 'objetivos alcanzados' },
                  { label: 'Pausadas', val: cnt.pausada, sub: 'en espera' },
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

        <div className="px-4 md:px-8 -mt-8 max-w-3xl mx-auto pb-10">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 mb-4 flex flex-wrap gap-2">
            {[
              { key: 'activa',  label: '🎯 Activas',  n: cnt.activa },
              { key: 'lograda', label: '🏆 Logradas', n: cnt.lograda },
              { key: 'pausada', label: '⏸ Pausadas', n: cnt.pausada },
              { key: 'todos',   label: 'Todas',       n: metas.length },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltroEstado(f.key)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                  filtroEstado === f.key ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
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
              <Button onClick={() => setMostrarNueva(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Crear primera meta
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {metasFiltradas.map(m => (
                <MetaCard key={m.id} meta={m} ninos={ninos}
                  onSelect={setMetaSel} onLograda={marcarLograda} />
              ))}
            </div>
          )}

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
        <MetaModal meta={metaSel} ninos={ninos} equipo={equipo} userId={user?.id} rol={rol}
          onClose={() => setMetaSel(null)}
          onUpdate={() => { refresh(); setMetaSel(null) }}
          onDelete={refresh} />
      )}
      {mostrarNueva && (
        <NuevaMetaModal ninos={ninos} equipo={equipo} userId={user?.id}
          onClose={() => setMostrarNueva(false)} onCreated={refresh} />
      )}
    </div>
  )
}