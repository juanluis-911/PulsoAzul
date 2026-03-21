'use client'

import { PECS_CATEGORIES } from './constants'
import { Loader2 } from 'lucide-react'

const CATEGORY_BG = {
  alimentacion: 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400',
  tiempo_libre: 'from-green-50 to-green-100 border-green-200 hover:border-green-400',
  educativo:    'from-red-50 to-red-100 border-red-200 hover:border-red-400',
  autonomia:    'from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400',
  social:       'from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-400',
  atributos:    'from-slate-50 to-slate-100 border-slate-200 hover:border-slate-400',
}

const CATEGORY_ICON_COLOR = {
  alimentacion: 'text-blue-600',
  tiempo_libre: 'text-green-600',
  educativo:    'text-red-600',
  autonomia:    'text-purple-600',
  social:       'text-yellow-600',
  atributos:    'text-slate-600',
}

export function QuickStart({ onLoadCategory, loadingCategory }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Cargar categoría completa</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Haz clic en una categoría para añadir todos sus pictogramas al set y poder imprimirlo de inmediato.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PECS_CATEGORIES.map((cat) => {
          const isLoading = loadingCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onLoadCategory(cat.id)}
              disabled={!!loadingCategory}
              className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 bg-gradient-to-br transition-all
                ${CATEGORY_BG[cat.id]}
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:shadow-md active:scale-95`}
            >
              {isLoading ? (
                <Loader2 className={`w-8 h-8 animate-spin ${CATEGORY_ICON_COLOR[cat.id]}`} />
              ) : (
                <span className="text-4xl">{cat.emoji}</span>
              )}
              <div className="text-center">
                <p className={`text-sm font-bold ${CATEGORY_ICON_COLOR[cat.id]}`}>{cat.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isLoading ? 'Cargando...' : 'Añadir al set'}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        Pictogramas de <span className="font-semibold">ARASAAC</span> — Portal Aragonés de Comunicación Aumentativa y Alternativa
      </p>
    </div>
  )
}
