'use client'

import { useEffect, useState } from 'react'
import { X, Trophy } from 'lucide-react'
import { NIVEL_CONFIG } from '@/lib/logros-definicion'

/**
 * Muestra una notificación temporal cuando se desbloquean logros nuevos.
 * Lee de sessionStorage 'logros_nuevos' y limpia la entrada.
 */
export function LogrosToast() {
  const [logros, setLogros] = useState([])
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('logros_nuevos')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.length) {
        sessionStorage.removeItem('logros_nuevos')
        setLogros(parsed)
        setVisible(true)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      if (idx < logros.length - 1) {
        setIdx(i => i + 1)
      } else {
        setVisible(false)
      }
    }, 4000)
    return () => clearTimeout(t)
  }, [visible, idx, logros])

  if (!visible || !logros[idx]) return null

  const logro = logros[idx]
  const nivel = NIVEL_CONFIG[logro.nivel] ?? NIVEL_CONFIG.bronce

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`flex items-start gap-3 ${nivel.bg} ${nivel.border} border rounded-2xl
                       shadow-xl px-4 py-3.5 max-w-sm`}>
        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0">
          {logro.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Trophy className={`w-3.5 h-3.5 ${nivel.color}`} />
            <p className={`text-[11px] font-bold uppercase tracking-wide ${nivel.color}`}>
              ¡Logro desbloqueado! · {nivel.label}
            </p>
          </div>
          <p className="font-bold text-slate-900 text-sm">{logro.nombre}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{logro.descripcion}</p>
          {logros.length > 1 && (
            <p className="text-[10px] text-slate-400 mt-1">{idx + 1} de {logros.length}</p>
          )}
        </div>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors mt-0.5"
        >
          <X className="w-3 h-3 text-slate-500" />
        </button>
      </div>
    </div>
  )
}
