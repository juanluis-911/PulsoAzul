'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { LayoutGrid, ChevronRight } from 'lucide-react'

const HERRAMIENTAS = [
  {
    href: '/material/pecs',
    icon: '🗂️',
    titulo: 'Generador de PECS',
    descripcion: 'Selecciona pictogramas por categoría y genera hojas imprimibles para comunicación aumentativa.',
    color: 'from-primary-50 to-primary-100 border-primary-200 hover:border-primary-400',
    iconColor: 'text-primary-600',
  },
  {
    href: '/material/horarios-visuales',
    icon: '📅',
    titulo: 'Horarios Visuales',
    descripcion: 'Crea secuencias visuales de actividades para rutinas diarias, terapias y jornadas escolares.',
    color: 'from-emerald-50 to-emerald-100 border-emerald-200 hover:border-emerald-400',
    iconColor: 'text-emerald-600',
  },
  {
    href: '/material/primero-despues',
    icon: '➡️',
    titulo: 'Primero — Después',
    descripcion: 'Tarjeta de dos pasos para comunicar secuencias simples. Herramienta básica de ABA.',
    color: 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400',
    iconColor: 'text-blue-600',
  },
  {
    href: '/material/economia-fichas',
    icon: '⭐',
    titulo: 'Economía de Fichas',
    descripcion: 'Diseña tableros de refuerzo con tokens para motivar conductas positivas en terapia.',
    color: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400',
    iconColor: 'text-amber-600',
  },
  {
    href: '/material/historias-sociales',
    icon: '📖',
    titulo: 'Historias Sociales',
    descripcion: 'Crea narrativas visuales página por página para enseñar situaciones sociales.',
    color: 'from-violet-50 to-violet-100 border-violet-200 hover:border-violet-400',
    iconColor: 'text-violet-600',
  },
  {
    href: '/material/tablero-emociones',
    icon: '😊',
    titulo: 'Tablero de Emociones',
    descripcion: 'Genera tableros visuales de emociones para que el niño comunique cómo se siente.',
    color: 'from-pink-50 to-pink-100 border-pink-200 hover:border-pink-400',
    iconColor: 'text-pink-600',
  },
  {
    href: '/material/tablero-elecciones',
    icon: '🔲',
    titulo: 'Tablero de Elecciones',
    descripcion: 'Presenta 2 a 6 opciones visuales para que el niño elija sin usar lenguaje verbal.',
    color: 'from-cyan-50 to-cyan-100 border-cyan-200 hover:border-cyan-400',
    iconColor: 'text-cyan-600',
  },
]

export default function MaterialPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-6">
          <h1 className="text-2xl font-bold">Material</h1>
          <p className="text-primary-100 text-sm mt-1">
            Herramientas y recursos para apoyar el desarrollo y la comunicación
          </p>
        </div>

        <div className="p-6 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HERRAMIENTAS.map((h) => (
              <Link
                key={h.href}
                href={h.href}
                className={`group flex flex-col gap-4 p-5 rounded-2xl border-2 bg-gradient-to-br transition-all hover:shadow-md active:scale-[0.98] ${h.color}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{h.icon}</span>
                  <ChevronRight className={`w-5 h-5 mt-1 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${h.iconColor}`} />
                </div>
                <div>
                  <p className={`font-bold text-base ${h.iconColor}`}>{h.titulo}</p>
                  <p className="text-sm text-slate-500 mt-1 leading-snug">{h.descripcion}</p>
                </div>
              </Link>
            ))}

            {/* Placeholder próximamente */}
            <div className="flex flex-col gap-4 p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-white opacity-50">
              <span className="text-4xl">🔜</span>
              <div>
                <p className="font-bold text-base text-slate-400">Próximamente</p>
                <p className="text-sm text-slate-400 mt-1">Más herramientas en camino</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
