'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { imageUrlToBase64 } from '@/lib/pecs-pdf'
import jsPDF from 'jspdf'
import { ChevronLeft, Printer, Search, X, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HelpModal } from '@/components/ui/HelpModal'
import { CategoryBrowser } from '@/components/pecs/CategoryBrowser'
import { PictogramGrid } from '@/components/pecs/PictogramGrid'

const MAX_CHOICES = 6

export default function TableroEleccionesPage() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('buscar')
  const [query, setQuery] = useState('')
  const [pictograms, setPictograms] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [choices, setChoices] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [generating, setGenerating] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  useEffect(() => {
    if (activeTab !== 'buscar') return
    if (!query.trim()) { setPictograms([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/pecs/search?q=${encodeURIComponent(query)}`)
        if (res.ok) setPictograms(await res.json())
      } finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, activeTab])

  const handleCategorySelect = async (catId) => {
    setActiveCategory(catId)
    if (!catId) { setPictograms([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/pecs/category?categoryId=${catId}`)
      if (res.ok) setPictograms(await res.json())
    } finally { setLoading(false) }
  }

  const handleToggle = useCallback((picto) => {
    const id = String(picto.id)
    if (!selectedIds.has(id) && choices.length >= MAX_CHOICES) return
    setChoices(prev => {
      const exists = prev.some(p => String(p.id) === id)
      return exists ? prev.filter(p => String(p.id) !== id) : [...prev, picto]
    })
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [choices.length, selectedIds])

  const handleRemove = (id) => {
    setChoices(prev => prev.filter(p => String(p.id) !== id))
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const handlePrint = async () => {
    if (!choices.length) return
    setGenerating(true)
    try {
      const withBase64 = await Promise.all(choices.map(async p => ({
        ...p,
        base64: await imageUrlToBase64(p.imageUrl),
      })))

      const n = withBase64.length
      const isLandscape = n >= 3
      const [W, H] = isLandscape ? [279.4, 215.9] : [215.9, 279.4]

      const doc = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'mm', format: [W, H] })
      const MARGIN = 15
      const GAP = 8
      const cols = Math.min(n, isLandscape ? n : Math.ceil(Math.sqrt(n)))
      const rows = Math.ceil(n / cols)
      const cellW = (W - MARGIN * 2 - (cols - 1) * GAP) / cols
      const cellH = (H - MARGIN * 2 - (rows - 1) * GAP) / rows - 10

      // Título
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(30, 30, 30)
      doc.text('¿Qué quieres?', W / 2, MARGIN + 6, { align: 'center' })

      const startY = MARGIN + 14

      withBase64.forEach((p, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = MARGIN + col * (cellW + GAP)
        const y = startY + row * (cellH + GAP + 10)

        // Borde
        doc.setDrawColor(100, 150, 255)
        doc.setLineWidth(2)
        doc.roundedRect(x, y, cellW, cellH, 6, 6)

        // Imagen
        if (p.base64) {
          try {
            const fmt = p.base64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
            doc.addImage(p.base64, fmt, x + 4, y + 4, cellW - 8, cellH - 8)
          } catch { /* skip */ }
        }

        // Label debajo
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(Math.max(8, cellW / 7))
        doc.setTextColor(30, 30, 30)
        const lines = doc.splitTextToSize(p.label || '', cellW - 4)
        doc.text(lines[0], x + cellW / 2, y + cellH + 7, { align: 'center' })
      })

      const fecha = new Date().toISOString().split('T')[0]
      doc.save(`tablero-elecciones-${fecha}.pdf`)
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
            <h1 className="text-xl font-bold">Tablero de Elecciones</h1>
            <HelpModal
              titulo="¿Cómo usar el Tablero de Elecciones?"
              pasos={[
                'Busca o navega por categorías para encontrar las opciones que quieres ofrecer.',
                'Haz clic en cada pictograma para agregarlo al tablero (mínimo 2, máximo 6).',
                'Descarga el PDF e imprímelo. Para uso frecuente, lamínalo.',
                'Muéstrale el tablero al niño y espera a que señale o toque su elección.',
              ]}
              ejemplo="A la hora del recreo, Luis no sabe qué quiere hacer y se frustra. Su maestra le presenta un tablero con 3 opciones: columpio, pelota y colorear. Luis señala la pelota. La maestra le da la pelota sin necesidad de palabras. Luis se calma al tener control de su elección."
            />
          </div>
          <p className="text-primary-100 text-sm mt-0.5">
            Presenta opciones visuales para que el niño elija sin usar lenguaje verbal
          </p>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Columna izquierda: browser */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('buscar')}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'buscar' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Search className="w-4 h-4" /> Buscar
              </button>
              <button
                onClick={() => setActiveTab('categorias')}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'categorias' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <LayoutGrid className="w-4 h-4" /> Categorías
              </button>
            </div>

            {activeTab === 'buscar' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Buscar pictograma..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white placeholder:text-slate-400"
                  />
                </div>
                <PictogramGrid pictograms={pictograms} selectedIds={selectedIds} onToggle={handleToggle} loading={loading} />
              </div>
            )}

            {activeTab === 'categorias' && (
              <div className="space-y-4">
                <CategoryBrowser activeCategory={activeCategory} onSelect={handleCategorySelect} />
                {activeCategory ? (
                  <PictogramGrid pictograms={pictograms} selectedIds={selectedIds} onToggle={handleToggle} loading={loading} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <LayoutGrid className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">Selecciona una categoría</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Panel derecho: elecciones seleccionadas */}
          <div className="lg:w-72 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-sm">Opciones</h2>
              <span className="text-xs text-slate-400">{choices.length}/{MAX_CHOICES}</span>
            </div>

            {choices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                <p className="text-xs text-center">Selecciona 2-6 pictogramas</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {choices.map(p => (
                  <div key={p.id} className="relative group bg-blue-50 rounded-xl border-2 border-blue-200 p-2 flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.label} className="w-16 h-16 object-contain" />
                    <p className="text-[10px] font-semibold text-slate-700 text-center mt-1 line-clamp-2">{p.label}</p>
                    <button
                      onClick={() => handleRemove(String(p.id))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {choices.length < MAX_CHOICES && (
              <p className="text-[10px] text-slate-400 text-center">
                Puedes agregar hasta {MAX_CHOICES - choices.length} más
              </p>
            )}

            <Button
              variant="primary"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              onClick={handlePrint}
              disabled={generating || choices.length < 2}
            >
              <Printer className="w-4 h-4" />
              {generating ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
