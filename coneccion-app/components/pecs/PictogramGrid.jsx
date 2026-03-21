'use client'

import { PictogramCard } from './PictogramCard'

export function PictogramGrid({ pictograms, selectedIds, onToggle, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="h-[90px] rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!pictograms.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <span className="text-4xl mb-3">🔍</span>
        <p className="text-sm">No se encontraron pictogramas</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {pictograms.map((picto) => (
        <PictogramCard
          key={picto.id}
          picto={picto}
          selected={selectedIds.has(String(picto.id))}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
