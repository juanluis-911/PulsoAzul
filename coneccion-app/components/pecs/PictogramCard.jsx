'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export function PictogramCard({ picto, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(picto)}
      className={cn(
        'relative flex flex-col items-center p-1.5 rounded-xl border-2 transition-all',
        'hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500',
        selected
          ? 'border-primary-500 bg-primary-50 shadow-sm shadow-primary-100'
          : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      {selected && (
        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center z-10">
          <Check className="w-3 h-3" />
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={picto.imageUrl}
        alt={picto.label}
        className="w-16 h-16 object-contain"
        loading="lazy"
      />
      <span className="text-[10px] font-medium text-slate-700 text-center leading-tight mt-1 w-full truncate px-1">
        {picto.label}
      </span>
    </button>
  )
}
