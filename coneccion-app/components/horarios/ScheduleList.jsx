import { CalendarDays, Printer, Bookmark, Trash2 } from 'lucide-react'
import { ScheduleItem } from './ScheduleItem'
import { Button } from '@/components/ui/Button'

/**
 * Panel derecho: lista ordenada de actividades del horario.
 */
export function ScheduleList({
  actividades,
  mostrarHoras,
  onToggleMostrarHoras,
  onMoveUp,
  onMoveDown,
  onRemove,
  onHoraChange,
  onClear,
  onPrint,
  onSave,
  generating,
}) {
  const isEmpty = actividades.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-800 text-sm">Secuencia del día</h2>
          {actividades.length > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">
              {actividades.length}
            </span>
          )}
        </div>
        {actividades.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Toggle mostrar horas */}
      {actividades.length > 0 && (
        <label className="flex items-center gap-2 mb-3 cursor-pointer shrink-0">
          <div
            onClick={onToggleMostrarHoras}
            className={`w-9 h-5 rounded-full transition-colors relative ${mostrarHoras ? 'bg-primary-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${mostrarHoras ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-slate-600">Mostrar horas</span>
        </label>
      )}

      {/* Lista de actividades */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-300">
            <CalendarDays className="w-10 h-10 mb-2" />
            <p className="text-xs text-center">Haz clic en un pictograma<br/>para agregarlo al horario</p>
          </div>
        ) : (
          actividades.map((actividad, index) => (
            <ScheduleItem
              key={`${actividad.pictogram_id}-${index}`}
              actividad={actividad}
              index={index}
              total={actividades.length}
              mostrarHoras={mostrarHoras}
              onMoveUp={() => onMoveUp(index)}
              onMoveDown={() => onMoveDown(index)}
              onRemove={onRemove}
              onHoraChange={onHoraChange}
            />
          ))
        )}
      </div>

      {/* Botones de acción */}
      {!isEmpty && (
        <div className="mt-3 space-y-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            className="w-full flex items-center justify-center gap-2"
            onClick={onPrint}
            disabled={generating}
          >
            <Printer className="w-4 h-4" />
            {generating ? 'Generando PDF...' : 'Imprimir / PDF'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full flex items-center justify-center gap-2"
            onClick={onSave}
          >
            <Bookmark className="w-4 h-4" />
            Guardar horario
          </Button>
        </div>
      )}
    </div>
  )
}
