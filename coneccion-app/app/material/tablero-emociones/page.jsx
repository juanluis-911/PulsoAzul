'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { imageUrlToBase64 } from '@/lib/pecs-pdf'
import jsPDF from 'jspdf'
import { ChevronLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HelpModal } from '@/components/ui/HelpModal'

// Emociones predefinidas con sus keywords para buscar en ARASAAC
const EMOCIONES_DEFAULT = [
  { id: 'feliz',       label: 'Feliz',       keyword: 'feliz',      color: [255, 220, 50], emoji: '😊' },
  { id: 'triste',      label: 'Triste',      keyword: 'triste',     color: [100, 150, 255], emoji: '😢' },
  { id: 'enojado',     label: 'Enojado',     keyword: 'enfadado',   color: [255, 80, 80],  emoji: '😠' },
  { id: 'asustado',    label: 'Asustado',    keyword: 'miedo',      color: [180, 100, 255], emoji: '😨' },
  { id: 'sorprendido', label: 'Sorprendido', keyword: 'sorpresa',   color: [255, 150, 50],  emoji: '😮' },
  { id: 'cansado',     label: 'Cansado',     keyword: 'cansado',    color: [150, 180, 150], emoji: '😴' },
  { id: 'nervioso',    label: 'Nervioso',    keyword: 'nervioso',   color: [255, 200, 100], emoji: '😰' },
  { id: 'orgulloso',   label: 'Orgulloso',   keyword: 'orgullo',    color: [100, 200, 100], emoji: '😌' },
]

export default function TableroEmocionesPage() {
  const [user, setUser] = useState(null)
  const [emociones, setEmociones] = useState(EMOCIONES_DEFAULT)
  const [seleccionadas, setSeleccionadas] = useState(new Set(EMOCIONES_DEFAULT.map(e => e.id)))
  const [imageCache, setImageCache] = useState({})
  const [loadingImages, setLoadingImages] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [mostrarEscala, setMostrarEscala] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  // Cargar pictogramas de ARASAAC para las emociones
  useEffect(() => {
    const load = async () => {
      setLoadingImages(true)
      const cache = {}
      await Promise.all(
        emociones.map(async (em) => {
          try {
            const res = await fetch(`/api/pecs/search?q=${encodeURIComponent(em.keyword)}`)
            if (res.ok) {
              const results = await res.json()
              if (results[0]) cache[em.id] = results[0].imageUrl
            }
          } catch { /* skip */ }
        })
      )
      setImageCache(cache)
      setLoadingImages(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleEmocion = (id) => {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePrint = async () => {
    const activas = emociones.filter(e => seleccionadas.has(e.id))
    if (!activas.length) return
    setGenerating(true)
    try {
      // Pre-cargar base64
      const base64Map = {}
      await Promise.all(activas.map(async (em) => {
        const url = imageCache[em.id]
        if (url) base64Map[em.id] = await imageUrlToBase64(url)
      }))

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [215.9, 279.4] })
      const W = 215.9, H = 279.4
      const MARGIN = 15
      const cols = Math.min(activas.length, 4)
      const rows = Math.ceil(activas.length / cols)
      const cellW = (W - MARGIN * 2 - (cols - 1) * 6) / cols
      const cellH = cellW * 1.2
      const totalH = rows * cellH + (rows - 1) * 6
      const startY = (H - totalH) / 2

      // Título
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(30, 30, 30)
      doc.text('¿Cómo me siento hoy?', W / 2, MARGIN + 8, { align: 'center' })

      activas.forEach((em, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = MARGIN + col * (cellW + 6)
        const y = startY + row * (cellH + 6)

        // Fondo de celda
        const [r, g, b] = em.color
        doc.setFillColor(r, g, b, 0.15)
        doc.setDrawColor(r, g, b)
        doc.setLineWidth(1.5)
        doc.roundedRect(x, y, cellW, cellH, 4, 4, 'FD')

        // Imagen
        const imgSize = cellW - 10
        const imgX = x + 5
        const imgY = y + 5

        if (base64Map[em.id]) {
          try {
            const fmt = base64Map[em.id].startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
            doc.addImage(base64Map[em.id], fmt, imgX, imgY, imgSize, imgSize * 0.75)
          } catch { /* skip */ }
        } else {
          // Emoji fallback
          doc.setFontSize(cellW * 0.5)
          doc.setTextColor(100, 100, 100)
          doc.text(em.emoji, x + cellW / 2, y + cellH * 0.5, { align: 'center' })
        }

        // Label
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(Math.max(7, cellW / 6))
        doc.setTextColor(40, 40, 40)
        doc.text(em.label, x + cellW / 2, y + cellH - 4, { align: 'center' })

        // Escala (si aplica)
        if (mostrarEscala) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setTextColor(120, 120, 120)
          doc.text(String(i + 1), x + cellW - 4, y + 8, { align: 'right' })
        }
      })

      const fecha = new Date().toISOString().split('T')[0]
      doc.save(`tablero-emociones-${fecha}.pdf`)
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
            <h1 className="text-xl font-bold">Tablero de Emociones</h1>
            <HelpModal
              titulo="¿Cómo usar el Tablero de Emociones?"
              pasos={[
                'Selecciona las emociones que quieres incluir (puedes desactivar las que no uses).',
                'Activa "Mostrar numeración" si quieres usar el tablero como escala de intensidad.',
                'Descarga el PDF, imprímelo y laminarlo para que dure más.',
                'Coloca el tablero a la vista del niño y úsalo en momentos de regulación emocional.',
              ]}
              ejemplo="Al llegar al colegio cada mañana, la maestra sombra le pregunta a Ana '¿Cómo te sientes hoy?' Ana señala la cara asustada. Esto le avisa al equipo que Ana necesita apoyo adicional ese día y le ofrecen actividades de calma antes de comenzar clases."
            />
          </div>
          <p className="text-primary-100 text-sm mt-0.5">
            Selecciona las emociones a incluir y genera un tablero imprimible
          </p>
        </div>

        <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-5">

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Selecciona las emociones a incluir</p>
            {loadingImages && (
              <p className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                Cargando pictogramas...
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {emociones.map(em => {
                const activa = seleccionadas.has(em.id)
                return (
                  <button
                    key={em.id}
                    onClick={() => toggleEmocion(em.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      activa
                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                        : 'border-slate-200 bg-white opacity-50'
                    }`}
                  >
                    {imageCache[em.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageCache[em.id]} alt={em.label} className="w-14 h-14 object-contain" />
                    ) : (
                      <span className="text-3xl">{em.emoji}</span>
                    )}
                    <span className="text-xs font-semibold text-slate-700">{em.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarEscala}
              onChange={e => setMostrarEscala(e.target.checked)}
              className="rounded border-slate-300 text-primary-600"
            />
            <span className="text-sm text-slate-600">Mostrar numeración (escala)</span>
          </label>

          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            onClick={handlePrint}
            disabled={generating || seleccionadas.size === 0}
          >
            <Printer className="w-4 h-4" />
            {generating ? 'Generando PDF...' : `Descargar PDF (${seleccionadas.size} emociones)`}
          </Button>
        </div>
      </main>
    </div>
  )
}
