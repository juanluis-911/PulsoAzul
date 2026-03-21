'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { HORARIO_PAPER_SIZES, HORARIO_LAYOUTS, PICTO_SIZE_OPTIONS } from './constants'

export function HorarioSettings({ settings, onChange, onConfirm, onClose, generating }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Configurar impresión</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Select
          label="Layout"
          value={settings.layout}
          onChange={(e) => onChange({ ...settings, layout: e.target.value })}
        >
          {HORARIO_LAYOUTS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </Select>

        <Select
          label="Tamaño del papel"
          value={settings.paperSize}
          onChange={(e) => onChange({ ...settings, paperSize: e.target.value })}
        >
          {HORARIO_PAPER_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>

        <Select
          label="Tamaño del pictograma"
          value={settings.pictoSize}
          onChange={(e) => onChange({ ...settings, pictoSize: e.target.value })}
        >
          {PICTO_SIZE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.showLabel}
            onChange={(e) => onChange({ ...settings, showLabel: e.target.checked })}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Mostrar etiqueta bajo cada pictograma
        </label>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={onConfirm} disabled={generating} className="flex-1">
            {generating ? 'Generando...' : 'Descargar PDF'}
          </Button>
        </div>
      </div>
    </div>
  )
}
