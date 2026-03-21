import { ChevronUp, ChevronDown, X } from 'lucide-react'

/**
 * Una actividad individual dentro del horario visual.
 * Muestra número de orden, imagen, label, hora opcional y controles.
 */
export function ScheduleItem({ actividad, index, total, mostrarHoras, onMoveUp, onMoveDown, onRemove, onHoraChange }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-2.5 group">
      {/* Número de orden */}
      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
        {index + 1}
      </span>

      {/* Imagen */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={actividad.imageUrl}
        alt={actividad.label}
        className="w-12 h-12 object-contain rounded-lg border border-slate-100 bg-white shrink-0"
      />

      {/* Label + hora */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{actividad.label}</p>
        {mostrarHoras && (
          <input
            type="time"
            value={actividad.hora || ''}
            onChange={(e) => onHoraChange(index, e.target.value)}
            className="mt-1 text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-400 w-24"
          />
        )}
      </div>

      {/* Controles ↑↓ + eliminar */}
      <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-0.5 rounded text-slate-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
          aria-label="Subir"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-0.5 rounded text-slate-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
          aria-label="Bajar"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => onRemove(index)}
        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
        aria-label="Eliminar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
