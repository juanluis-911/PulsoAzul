'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

/**
 * Botón de ayuda con modal flotante.
 *
 * Props:
 *   titulo    - Título del modal (ej: "¿Cómo funciona?")
 *   ejemplo   - Texto del caso de uso práctico
 *   pasos     - Array de strings con los pasos de uso (opcional)
 */
export function HelpModal({ titulo, ejemplo, pasos }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0"
        aria-label="Ayuda"
        title="¿Cómo se usa?"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4 text-primary-600" />
                </span>
                <h2 className="font-bold text-slate-900 text-base">{titulo || '¿Cómo se usa?'}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pasos (si se proporcionan) */}
            {pasos?.length > 0 && (
              <ol className="space-y-2">
                {pasos.map((paso, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 leading-snug">{paso}</p>
                  </li>
                ))}
              </ol>
            )}

            {/* Ejemplo */}
            {ejemplo && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Ejemplo práctico</p>
                <p className="text-sm text-amber-900 leading-relaxed">{ejemplo}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
