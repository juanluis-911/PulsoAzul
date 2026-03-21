'use client'

import { X, Printer, Save, Trash2, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function SelectionTray({ selected, onRemove, onClear, onPrint, onSave, generating }) {

  // ── Estado vacío ──────────────────────────────────────────────────────
  if (!selected.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center
                      border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
        <ImageOff className="w-8 h-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-400">Sin pictogramas seleccionados</p>
        <p className="text-xs text-slate-300 max-w-[180px] leading-relaxed">
          Busca o navega por categorías y toca un pictograma para añadirlo
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Grid de pictogramas ──────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        {selected.map((picto, idx) => (
          <div
            key={`${picto.id}-${idx}`}
            className="relative group flex flex-col items-center gap-1 p-1.5
                       bg-white rounded-xl border border-slate-200
                       hover:border-primary-300 hover:shadow-sm transition-all"
          >
            {/* Número de orden */}
            <span className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-primary-600 text-white
                             text-[9px] font-bold flex items-center justify-center leading-none z-10">
              {idx + 1}
            </span>

            {/* Botón eliminar */}
            <button
              onClick={() => onRemove(String(picto.id))}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                         bg-red-500 text-white flex items-center justify-center z-10
                         opacity-0 group-hover:opacity-100 transition-opacity
                         hover:bg-red-600 hover:scale-110 shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Imagen */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={picto.imageUrl}
              alt={picto.label}
              className="w-full aspect-square object-contain rounded-lg"
            />

            {/* Etiqueta */}
            <span className="text-[10px] text-slate-500 text-center leading-tight line-clamp-2 w-full px-0.5">
              {picto.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Acciones ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <Button
          variant="primary"
          size="sm"
          onClick={onPrint}
          disabled={generating}
          className="gap-2 w-full justify-center"
        >
          <Printer className="w-4 h-4" />
          {generating ? 'Generando PDF…' : 'Imprimir / PDF'}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            className="gap-1.5 flex-1 justify-center"
          >
            <Save className="w-4 h-4" />
            Guardar set
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1.5 text-red-500 hover:bg-red-50 px-3"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </Button>
        </div>
      </div>

    </div>
  )
}
