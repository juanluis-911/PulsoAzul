'use client'

import { X, Printer, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function SelectionTray({ selected, onRemove, onClear, onPrint, onSave, generating }) {
  if (!selected.length) {
    return (
      <div className="flex items-center justify-center h-20 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
        Selecciona pictogramas para añadirlos aquí
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {selected.map((picto, idx) => (
          <div key={`${picto.id}-${idx}`} className="relative shrink-0 flex flex-col items-center w-16">
            <button
              onClick={() => onRemove(String(picto.id))}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center z-10 hover:bg-red-600 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={picto.imageUrl}
              alt={picto.label}
              className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white"
            />
            <span className="text-[9px] text-slate-500 text-center truncate max-w-full mt-0.5">
              {picto.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-red-500 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
          Limpiar ({selected.length})
        </Button>
        <Button variant="secondary" size="sm" onClick={onSave} className="gap-1.5">
          <Save className="w-4 h-4" />
          Guardar set
        </Button>
        <Button variant="primary" size="sm" onClick={onPrint} disabled={generating} className="gap-1.5">
          <Printer className="w-4 h-4" />
          {generating ? 'Generando PDF...' : 'Imprimir / PDF'}
        </Button>
      </div>
    </div>
  )
}
