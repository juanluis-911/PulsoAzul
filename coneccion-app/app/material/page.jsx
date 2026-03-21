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
  // Aquí van las próximas herramientas
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
