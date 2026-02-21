'use client'

import { useState } from 'react'
import { ChevronDown, School, Heart, Home } from 'lucide-react'
import { formatearFecha, ESTADOS_ANIMO } from '@/lib/utils'

const TIPO_REGISTRO = {
  escuela: { label: 'Escuela',  Icon: School, color: 'bg-blue-100 text-blue-700' },
  terapia: { label: 'Terapia',  Icon: Heart,  color: 'bg-purple-100 text-purple-700' },
  casa:    { label: 'Casa',     Icon: Home,   color: 'bg-green-100 text-green-700' },
}

const ETIQUETA_ROL = {
  padre:          { label: 'Papá / Mamá', color: 'bg-amber-100 text-amber-700' },
  maestra_sombra: { label: 'Maestra',     color: 'bg-blue-100 text-blue-700' },
  terapeuta:      { label: 'Terapeuta',   color: 'bg-purple-100 text-purple-700' },
}

export function RegistroCard({ registro }) {
  const [open, setOpen] = useState(false)

  const tipo      = TIPO_REGISTRO[registro.tipo_registro] || TIPO_REGISTRO.escuela
  const { Icon }  = tipo
  const autor     = registro.perfiles
  const rolAutor  = ETIQUETA_ROL[autor?.rol_principal] || ETIQUETA_ROL.padre
  const nombre    = autor?.nombre_completo?.split(' ')[0] || 'Alguien'

  // ¿Hay contenido extra para mostrar?
  const tieneExtra = registro.desafios || registro.notas || registro.actividades?.length > 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* Franja superior: niño + estado de ánimo */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-100">
        <div>
          <p className="font-semibold text-slate-900 text-sm">
            {registro.ninos?.nombre} {registro.ninos?.apellido}
          </p>
          <p className="text-xs text-slate-500">{formatearFecha(registro.fecha)}</p>
        </div>
        {registro.estado_animo && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_ANIMO[registro.estado_animo].color}`}>
            {ESTADOS_ANIMO[registro.estado_animo].emoji} {ESTADOS_ANIMO[registro.estado_animo].label}
          </span>
        )}
      </div>

      {/* Cuerpo: resumen visible siempre */}
      <div className="px-4 py-3 space-y-1">
        {registro.logros && (
          <p className="text-sm text-slate-700">
            <span className="font-medium">✨ Logro:</span> {registro.logros}
          </p>
        )}
        {!registro.logros && !registro.desafios && registro.notas && (
          <p className="text-sm text-slate-600 italic">{registro.notas}</p>
        )}
      </div>

      {/* Detalle expandible */}
      {tieneExtra && open && (
        <div className="px-4 pb-3 space-y-3 border-t border-slate-100 pt-3">
          {registro.desafios && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">🎯 Desafíos</p>
              <p className="text-sm text-slate-700">{registro.desafios}</p>
            </div>
          )}
          {registro.notas && registro.logros && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">📝 Notas</p>
              <p className="text-sm text-slate-700">{registro.notas}</p>
            </div>
          )}
          {registro.actividades?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">🗂 Actividades</p>
              <div className="flex flex-wrap gap-1">
                {registro.actividades.map((act, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs">
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pie: tipo + autor + botón expandir */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tipo.color}`}>
            <Icon className="w-3 h-3" />
            {tipo.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rolAutor.color}`}>
            {nombre} · {rolAutor.label}
          </span>
        </div>

        {tieneExtra && (
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            {open ? 'Ver menos' : 'Ver más'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  )
}