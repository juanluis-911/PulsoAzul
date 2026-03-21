'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { imageUrlToBase64 } from '@/lib/pecs-pdf'
import jsPDF from 'jspdf'
import { ChevronLeft, Search, X, Printer } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { HelpModal } from '@/components/ui/HelpModal'

function PictoSlot({ label, color, picto, onSelect, onClear }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/pecs/search?q=${encodeURIComponent(query)}`)
        if (res.ok) setResults(await res.json())
      } finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  return (
    <div className="flex-1 flex flex-col items-center gap-3">
      <div className={`w-full rounded-2xl border-4 ${color} p-2 text-center`}>
        <p className="text-base font-bold mb-2" style={{ color: color.includes('blue') ? '#1d4ed8' : '#15803d' }}>{label}</p>

        {picto ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picto.imageUrl} alt={picto.label} className="w-40 h-40 object-contain mx-auto rounded-xl bg-white" />
            <button
              onClick={onClear}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="mt-2 text-sm font-semibold text-slate-700">{picto.label}</p>
          </div>
        ) : (
          <button
            onClick={() => setOpen(v => !v)}
            className="w-40 h-40 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors mx-auto"
          >
            <Search className="w-8 h-8" />
            <span className="text-xs">Buscar pictograma</span>
          </button>
        )}
      </div>

      {/* Buscador inline */}
      {open && !picto && (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-3 space-y-2">
          <input
            autoFocus
            type="search"
            placeholder="Ej: comer, jugar, dormir..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {loading && <p className="text-xs text-slate-400 text-center py-2">Buscando...</p>}
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelect(p); setOpen(false); setQuery(''); setResults([]) }}
                className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-primary-50 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.label} className="w-12 h-12 object-contain" />
                <span className="text-[10px] text-slate-600 text-center leading-tight line-clamp-2">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PrimeroDepuesPage() {
  const [user, setUser] = useState(null)
  const [primero, setPrimero] = useState(null)
  const [despues, setDespues] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const handlePrint = async () => {
    if (!primero && !despues) return
    setGenerating(true)
    try {
      const [b1, b2] = await Promise.all([
        primero ? imageUrlToBase64(primero.imageUrl) : Promise.resolve(null),
        despues  ? imageUrlToBase64(despues.imageUrl)  : Promise.resolve(null),
      ])

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [215.9, 139.7] })
      const W = 215.9, H = 139.7
      const MARGIN = 10, GAP = 8
      const cardW = (W - MARGIN * 2 - GAP) / 2
      const cardH = H - MARGIN * 2

      const drawCard = (x, title, color, base64, label) => {
        const [r, g, b] = color
        doc.setDrawColor(r, g, b)
        doc.setLineWidth(2)
        doc.roundedRect(x, MARGIN, cardW, cardH, 6, 6)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(r, g, b)
        doc.text(title, x + cardW / 2, MARGIN + 12, { align: 'center' })

        const imgY = MARGIN + 18
        const imgH = cardH - 40

        if (base64) {
          try {
            const fmt = base64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
            doc.addImage(base64, fmt, x + 8, imgY, cardW - 16, imgH)
          } catch {
            doc.setFillColor(240, 240, 240)
            doc.rect(x + 8, imgY, cardW - 16, imgH, 'F')
          }
        } else {
          doc.setFillColor(240, 240, 240)
          doc.rect(x + 8, imgY, cardW - 16, imgH, 'F')
        }

        if (label) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(30, 30, 30)
          doc.text(label, x + cardW / 2, MARGIN + cardH - 6, { align: 'center' })
        }
      }

      drawCard(MARGIN, 'PRIMERO', [59, 130, 246], b1, primero?.label || '')
      drawCard(MARGIN + cardW + GAP, 'DESPUÉS', [34, 197, 94], b2, despues?.label || '')

      const fecha = new Date().toISOString().split('T')[0]
      doc.save(`primero-despues-${fecha}.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0 flex flex-col">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-5 shrink-0">
          <Link href="/material" className="inline-flex items-center gap-1 text-primary-200 hover:text-white text-xs mb-2 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Material
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Primero — Después</h1>
            <HelpModal
              titulo="¿Cómo usar Primero — Después?"
              pasos={[
                'Haz clic en la caja azul "PRIMERO" y busca la actividad que debe hacerse antes.',
                'Haz clic en la caja verde "DESPUÉS" y busca la actividad que viene como premio o siguiente paso.',
                'Descarga el PDF, recórtalo y colócalo donde el niño pueda verlo fácilmente.',
              ]}
              ejemplo="Diego tiene dificultades para hacer la tarea. Su maestra prepara una tarjeta: PRIMERO (tarea de matemáticas) → DESPUÉS (iPad por 10 minutos). Diego puede ver la tarjeta y sabe exactamente qué tiene que hacer para llegar a su premio favorito."
            />
          </div>
          <p className="text-primary-100 text-sm mt-0.5">
            Tarjeta de dos pasos para comunicar secuencias simples de actividades
          </p>
        </div>

        <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <PictoSlot
              label="PRIMERO"
              color="border-blue-400 bg-blue-50"
              picto={primero}
              onSelect={setPrimero}
              onClear={() => setPrimero(null)}
            />

            {/* Flecha central */}
            <div className="hidden sm:flex items-center justify-center text-4xl text-slate-300 shrink-0 pt-16">
              →
            </div>

            <PictoSlot
              label="DESPUÉS"
              color="border-emerald-400 bg-emerald-50"
              picto={despues}
              onSelect={setDespues}
              onClear={() => setDespues(null)}
            />
          </div>

          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            onClick={handlePrint}
            disabled={generating || (!primero && !despues)}
          >
            <Printer className="w-4 h-4" />
            {generating ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
        </div>
      </main>
    </div>
  )
}
