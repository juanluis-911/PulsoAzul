'use client'

import { cn } from '@/lib/utils'
import { PECS_CATEGORIES } from './constants'

export function CategoryBrowser({ activeCategory, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all',
          activeCategory === null
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        Todas
      </button>
      {PECS_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all',
            activeCategory === cat.id
              ? cat.activeTailwind
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          )}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  )
}
