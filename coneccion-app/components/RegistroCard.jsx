'use client'

import { useState } from 'react'
import { School, Heart, Home, ChevronDown } from 'lucide-react'
import { formatearFecha, ESTADOS_ANIMO } from '@/lib/utils'

const TIPO_MAP = {
  escuela: { label: 'Escuela', Icon: School, cls: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-400' },
  terapia: { label: 'Terapia', Icon: Heart,  cls: 'bg-violet-50 text-violet-600', dot: 'bg-violet-400' },
  casa:    { label: 'Casa',    Icon: Home,   cls: 'bg-green-50 text-green-600',   dot: 'bg-green-400' },
}

const ROL_LABEL = {
  padre:          'Papá / Mamá',
  maestra_sombra: 'Maestra',
  terapeuta:      'Terapeuta',
}

const NIVEL_APOYO_LABEL = [
  'Independiente', 'Indicación verbal', 'Modelado',
  'Apoyo físico parcial', 'Apoyo físico total',
]

function Chip({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      {children}
    </span>
  )
}

/**
 * RegistroCard — compatible con dos fuentes de datos:
 *
 * 1. Dashboard (autor embebido via join):
 *    <RegistroCard registro={r} />
 *    → sin onClick: muestra acordeón con info extra
 *
 * 2. Historial (autor cargado por separado):
 *    <RegistroCard r={r} autor={autores[r.creado_por]} onClick={() => ...} />
 *    → con onClick: abre drawer, sin acordeón
 */
export function RegistroCard({ registro, r, autor: autorProp, onClick }) {
  const [open, setOpen] = useState(false)

  const data   = registro ?? r
  const autor  = autorProp ?? registro?.perfiles
  const m      = data.metricas ?? {}

  const tipo   = TIPO_MAP[data.tipo_registro] ?? { label: data.tipo_registro, cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' }
  const estado = data.estado_animo ? ESTADOS_ANIMO?.[data.estado_animo] : null
  const nombre = autor?.nombre_completo?.split(' ')[0]

  // Info extra para el acordeón (solo relevante en dashboard)
  const contextoFlags = m.contexto
    ? Object.entries(m.contexto).filter(([, v]) => v).map(([k]) => k)
    : []
  const CONTEXTO_EMOJI = {
    durmio_bien:       '😴 Durmió bien',
    comio_bien:        '🍽️ Comió bien',
    tomo_medicamento:  '💊 Medicamento',
    cambio_rutina:     '🔄 Cambio de rutina',
    evento_estresante: '⚡ Evento estresante',
    buen_descanso_fin: '🏖️ Descansó el fin',
  }

  const tieneExtra = !onClick && (
    data.notas || data.desafios ||
    contextoFlags.length > 0 ||
    m.regulacion ||
    m.nivel_apoyo_general != null ||
    m.actividades?.length > 0
  )

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden
                  transition-all duration-150
                  ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200 active:scale-[0.99]' : ''}`}
    >
      {/* Barra de color superior */}
      <div className={`h-1 w-full ${tipo.dot}`} />

      <div className="p-4">
        {/* Cabecera: nombre + chips */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">
              {data.ninos ? `${data.ninos.nombre} ${data.ninos.apellido}` : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{formatearFecha(data.fecha)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
            <Chip className={tipo.cls}>{tipo.label}</Chip>
            {estado && <Chip className={estado.color}>{estado.emoji} {estado.label}</Chip>}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="space-y-1.5">
          {data.logros && (
            <p className="text-sm text-slate-700 leading-snug">
              <span className="font-semibold text-emerald-700">✨ Logro:</span> {data.logros}
            </p>
          )}
          {data.desafios && onClick && (
            <p className="text-sm text-slate-700 leading-snug">
              <span className="font-semibold text-orange-600">🎯 Desafío:</span> {data.desafios}
            </p>
          )}
          {data.notas && !data.logros && !data.desafios && (
            <p className="text-sm text-slate-500 italic line-clamp-2">{data.notas}</p>
          )}
        </div>

        {/* Acordeón — solo en dashboard (sin onClick) */}
        {tieneExtra && open && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            {data.desafios && (
              <p className="text-sm text-slate-700 leading-snug">
                <span className="font-semibold text-orange-600">🎯 Desafío:</span> {data.desafios}
              </p>
            )}
            {data.notas && (data.logros || data.desafios) && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-500">📝 Notas:</span> {data.notas}
              </p>
            )}
            {contextoFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Contexto del día</p>
                <div className="flex flex-wrap gap-1.5">
                  {contextoFlags.map(k => (
                    <span key={k} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                      {CONTEXTO_EMOJI[k] ?? k}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {m.regulacion && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Regulación emocional</p>
                <div className="flex gap-3">
                  {m.regulacion.inicio != null && (
                    <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">
                      Inicio: {m.regulacion.inicio}/5
                    </span>
                  )}
                  {m.regulacion.fin != null && (
                    <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">
                      Final: {m.regulacion.fin}/5
                    </span>
                  )}
                </div>
              </div>
            )}
            {m.nivel_apoyo_general != null && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Nivel de apoyo</p>
                <span className="text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full">
                  {NIVEL_APOYO_LABEL[m.nivel_apoyo_general] ?? m.nivel_apoyo_general}
                </span>
              </div>
            )}
            {m.actividades?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Actividades</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.actividades.map((a, i) => (
                    <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                      {a.tipo}{a.participacion != null ? ` · ${a.participacion}/3` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pie: autor + botón Ver más */}
        <div className={`flex items-center justify-between ${tieneExtra || autor ? 'mt-3 pt-3 border-t border-slate-50' : ''}`}>
          {autor ? (
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs
                               font-bold flex items-center justify-center shrink-0">
                {autor.nombre_completo?.charAt(0).toUpperCase()}
              </span>
              <p className="text-xs text-slate-400">
                {nombre}
                {autor.rol_principal && ` · ${ROL_LABEL[autor.rol_principal] ?? autor.rol_principal}`}
              </p>
            </div>
          ) : <div />}

          {tieneExtra && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {open ? 'Ver menos' : 'Ver más'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}