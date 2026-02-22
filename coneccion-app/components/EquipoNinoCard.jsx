'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, School, Heart, User, UserPlus } from 'lucide-react'

const ROL_CONFIG = {
  maestra_sombra: { label: 'Maestra sombra', Icon: School, color: 'bg-blue-100 text-blue-700' },
  terapeuta:      { label: 'Terapeuta',       Icon: Heart,  color: 'bg-purple-100 text-purple-700' },
  padre:          { label: 'Padre / Madre',   Icon: User,   color: 'bg-amber-100 text-amber-700' },
}

export function EquipoNinoCard({ nino, rol }) {
  const [open, setOpen] = useState(false)

  const totalMiembros = nino.equipo?.length || 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* Cabecera clickeable */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          {/* Avatar inicial */}
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary-700 font-bold text-sm">
              {nino.nombre?.[0]}{nino.apellido?.[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {nino.nombre} {nino.apellido}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalMiembros === 0
                ? 'Sin equipo asignado'
                : `${totalMiembros} ${totalMiembros === 1 ? 'miembro' : 'miembros'} en el equipo`}
            </p>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Lista del equipo expandible */}
      {open && (
        <div className="border-t border-slate-100 px-5 py-3 space-y-2">
          {totalMiembros > 0 ? (
            nino.equipo.map((miembro, i) => {
              const config = ROL_CONFIG[miembro.rol] || ROL_CONFIG.padre
              const { Icon } = config
              const nombre = miembro.perfiles?.nombre_completo || 'Sin nombre'

              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{nombre}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${config.color}`}>
                        {config.label}
                      </span>
                      {miembro.perfiles?.telefono && (
                        <a
                          href={`tel:${miembro.perfiles.telefono}`}
                          className="block text-xs text-slate-500 hover:text-primary-600 mt-0.5"
                          onClick={e => e.stopPropagation()}
                        >
                          📞 {miembro.perfiles.telefono}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {miembro.permisos === 'edicion' ? '✏️ Edición' : '👁 Lectura'}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-slate-500 mb-3">No hay profesionales asignados aún</p>
              {rol === 'padre' && (
                <Link
                  href="/invitar"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Invitar al equipo
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}