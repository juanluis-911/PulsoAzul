'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, School, Heart, User, UserPlus, Phone } from 'lucide-react'

const formatearTelefono = (tel) => {
  const digits = tel.replace(/\D/g, '')
  if (digits.length === 10) return `+52${digits}`
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`
  return `+${digits}`
}

const whatsappUrl = (tel) => `https://wa.me/${formatearTelefono(tel).replace('+', '')}`

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
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${miembro.perfiles.telefono}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600"
                          >
                            <Phone className="w-3 h-3" />
                            {miembro.perfiles.telefono}
                          </a>
                          <a
                            href={whatsappUrl(miembro.perfiles.telefono)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.852L.057 23.57a.75.75 0 0 0 .906.94l5.878-1.516A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.187-1.448l-.37-.22-3.838.99 1.023-3.715-.242-.383A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                            </svg>
                            WhatsApp
                          </a>
                        </div>
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