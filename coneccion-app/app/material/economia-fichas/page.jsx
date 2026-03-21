'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { imageUrlToBase64 } from '@/lib/pecs-pdf'
import jsPDF from 'jspdf'
import { ChevronLeft, Printer, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HelpModal } from '@/components/ui/HelpModal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'

const TOKEN_STYLES = [
  { value: 'star',   label: '⭐ Estrella',  emoji: '⭐' },
  { value: 'check',  label: '✅ Palomita',  emoji: '✅' },
  { value: 'heart',  label: '❤️ Corazón',   emoji: '❤️' },
  { value: 'circle', label: '🔵 Círculo',   emoji: '🔵' },
]

const TOKEN_COUNTS = [3, 5, 7, 10, 15, 20]

// Dibuja el símbolo del token en el PDF
function drawToken(doc, style, x, y, size, filled) {
  const cx = x + size / 2
  const cy = y + size / 2
  const r = size / 2 - 2

  if (filled) {
    doc.setFillColor(255, 220, 50)
    doc.setDrawColor(200, 160, 0)
  } else {
    doc.setFillColor(240, 240, 240)
    doc.setDrawColor(200, 200, 200)
  }

  doc.setLineWidth(1)

  // Todos los estilos usan un círculo base
  doc.circle(cx, cy, r, filled ? 'FD' : 'D')

  if (style === 'check' && filled) {
    // Palomita dibujada con líneas
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(1.5)
    doc.line(cx - r * 0.45, cy, cx - r * 0.05, cy + r * 0.45)
    doc.line(cx - r * 0.05, cy + r * 0.45, cx + r * 0.5, cy - r * 0.35)
  } else if (style === 'star' && filled) {
    // Estrella de 5 puntas dibujada con líneas
    doc.setDrawColor(200, 140, 0)
    doc.setLineWidth(0.8)
    const outerR = r * 0.9
    const innerR = r * 0.4
    const points = []
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2
      const radius = i % 2 === 0 ? outerR : innerR
      points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
    }
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i]
      const [x2, y2] = points[(i + 1) % points.length]
      doc.line(x1, y1, x2, y2)
    }
  } else if (style === 'heart' && filled) {
    // Corazón simplificado: dos círculos pequeños + triángulo
    doc.setFillColor(220, 50, 50)
    doc.setDrawColor(180, 20, 20)
    doc.circle(cx - r * 0.3, cy - r * 0.15, r * 0.38, 'FD')
    doc.circle(cx + r * 0.3, cy - r * 0.15, r * 0.38, 'FD')
    // Triángulo inferior
    doc.setFillColor(220, 50, 50)
    doc.triangle(
      cx - r * 0.65, cy - r * 0.1,
      cx + r * 0.65, cy - r * 0.1,
      cx, cy + r * 0.7,
      'F'
    )
  }
}

export default function EconomiaFichasPage() {
  const [user, setUser] = useState(null)
  const [nombreNino, setNombreNino] = useState('')
  const [nombreRefuerzo, setNombreRefuerzo] = useState('')
  const [numTokens, setNumTokens] = useState(5)
  const [tokenStyle, setTokenStyle] = useState('star')
  const [refuerzoPicto, setRefuerzoPicto] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/pecs/search?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) setSearchResults(await res.json())
      } finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handlePrint = async () => {
    setGenerating(true)
    try {
      const refBase64 = refuerzoPicto ? await imageUrlToBase64(refuerzoPicto.imageUrl) : null

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [215.9, 279.4] })
      const W = 215.9, H = 279.4
      const MARGIN = 15

      // Fondo decorativo
      doc.setFillColor(254, 252, 232)
      doc.rect(0, 0, W, H, 'F')

      // Borde
      doc.setDrawColor(251, 191, 36)
      doc.setLineWidth(3)
      doc.roundedRect(5, 5, W - 10, H - 10, 8, 8, 'S')

      // Título
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(30, 30, 30)
      const title = nombreNino ? `¡Tablero de ${nombreNino}!` : 'Mi Tablero de Fichas'
      doc.text(title, W / 2, MARGIN + 12, { align: 'center' })

      // Instrucción
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text('Consigue todas las fichas para ganar tu premio:', W / 2, MARGIN + 22, { align: 'center' })

      // Premio / Refuerzo
      const premioY = MARGIN + 28
      const premioH = 45
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(251, 191, 36)
      doc.setLineWidth(1.5)
      doc.roundedRect(MARGIN, premioY, W - MARGIN * 2, premioH, 6, 6, 'FD')

      if (refBase64) {
        try {
          const fmt = refBase64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          doc.addImage(refBase64, fmt, MARGIN + 4, premioY + 4, 37, 37)
        } catch { /* skip */ }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(30, 30, 30)
        const refLabel = nombreRefuerzo || refuerzoPicto?.label || 'Premio'
        doc.text(refLabel, MARGIN + 47, premioY + premioH / 2 + 2)
      } else {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(100, 100, 100)
        doc.text(nombreRefuerzo || 'Mi Premio', W / 2, premioY + premioH / 2 + 3, { align: 'center' })
      }

      // Tokens
      const tokenAreaY = premioY + premioH + 12
      const tokenSize = 22
      const cols = Math.min(numTokens, 10)
      const rows = Math.ceil(numTokens / cols)
      const totalW = cols * tokenSize + (cols - 1) * 6
      const startX = (W - totalW) / 2

      for (let i = 0; i < numTokens; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const tx = startX + col * (tokenSize + 6)
        const ty = tokenAreaY + row * (tokenSize + 6)
        drawToken(doc, tokenStyle, tx, ty, tokenSize, false)
      }

      const fecha = new Date().toISOString().split('T')[0]
      doc.save(`economia-fichas-${fecha}.pdf`)
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
            <h1 className="text-xl font-bold">Economía de Fichas</h1>
            <HelpModal
              titulo="¿Cómo usar la Economía de Fichas?"
              pasos={[
                'Escribe el nombre del niño y el premio que ganará al completar todas las fichas.',
                'Elige cuántas fichas necesita juntar (entre 3 y 20) y el estilo del token.',
                'Opcionalmente agrega una imagen del premio para hacerlo más visual.',
                'Descarga e imprime el tablero. Pega o tacha cada ficha cuando la gane.',
              ]}
              ejemplo="Carlos tiene dificultades para terminar sus actividades. Su terapeuta crea un tablero con 5 estrellas y como premio '10 minutos de tiempo libre'. Cada vez que Carlos completa una tarea sin interrupciones, gana una estrella. Al llegar a 5, elige lo que quiere hacer."
            />
          </div>
          <p className="text-primary-100 text-sm mt-0.5">
            Diseña un tablero de refuerzo para motivar conductas positivas
          </p>
        </div>

        <div className="flex-1 p-6 max-w-lg mx-auto w-full space-y-5">

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <p className="text-sm font-semibold text-slate-700">Configuración</p>

            <Input
              label="Nombre del niño (opcional)"
              placeholder="Ej: Mateo"
              value={nombreNino}
              onChange={e => setNombreNino(e.target.value)}
            />

            <Input
              label="Nombre del premio / refuerzo"
              placeholder="Ej: Ver un video, tiempo libre..."
              value={nombreRefuerzo}
              onChange={e => setNombreRefuerzo(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Número de fichas"
                value={numTokens}
                onChange={e => setNumTokens(Number(e.target.value))}
              >
                {TOKEN_COUNTS.map(n => (
                  <option key={n} value={n}>{n} fichas</option>
                ))}
              </Select>

              <Select
                label="Estilo de ficha"
                value={tokenStyle}
                onChange={e => setTokenStyle(e.target.value)}
              >
                {TOKEN_STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>

            {/* Pictograma del premio */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Imagen del premio (opcional)</p>
              {refuerzoPicto ? (
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-2 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={refuerzoPicto.imageUrl} alt={refuerzoPicto.label} className="w-12 h-12 object-contain rounded-lg border border-slate-100 bg-white" />
                  <span className="text-sm font-medium text-slate-700 flex-1">{refuerzoPicto.label}</span>
                  <button onClick={() => setRefuerzoPicto(null)} className="p-1.5 text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(v => !v)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <Search className="w-4 h-4" /> Buscar pictograma
                </button>
              )}

              {showSearch && !refuerzoPicto && (
                <div className="mt-2 bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                  <input
                    autoFocus
                    type="search"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {searching && <p className="text-xs text-slate-400 text-center py-1">Buscando...</p>}
                  <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto">
                    {searchResults.map(p => (
                      <button key={p.id} onClick={() => { setRefuerzoPicto(p); setShowSearch(false); setSearchQuery('') }}
                        className="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-primary-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.imageUrl} alt={p.label} className="w-10 h-10 object-contain" />
                        <span className="text-[9px] text-slate-500 text-center line-clamp-2">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vista previa de tokens */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-3 text-center">Vista previa del tablero</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from({ length: numTokens }).map((_, i) => (
                <span key={i} className="text-2xl">
                  {TOKEN_STYLES.find(t => t.value === tokenStyle)?.emoji || '⭐'}
                </span>
              ))}
            </div>
            {(nombreNino || nombreRefuerzo) && (
              <p className="text-xs text-amber-600 text-center mt-3 font-medium">
                {nombreNino ? `¡Tablero de ${nombreNino}!` : 'Mi tablero'}{nombreRefuerzo ? ` → ${nombreRefuerzo}` : ''}
              </p>
            )}
          </div>

          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            onClick={handlePrint}
            disabled={generating}
          >
            <Printer className="w-4 h-4" />
            {generating ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
        </div>
      </main>
    </div>
  )
}
