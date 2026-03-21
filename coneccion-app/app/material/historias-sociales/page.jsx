'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { imageUrlToBase64 } from '@/lib/pecs-pdf'
import jsPDF from 'jspdf'
import {
  ChevronLeft, Plus, Trash2, ChevronUp, ChevronDown,
  Search, X, Printer, Bookmark, BookmarkX
} from 'lucide-react'
import { HelpModal } from '@/components/ui/HelpModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'

function PageEditor({ pagina, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/pecs/search?q=${encodeURIComponent(query)}`)
        if (res.ok) setResults(await res.json())
      } finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => onUpdate({ ...pagina, imageUrl: reader.result, isCustom: true })
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Cabecera de página */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Página {index + 1}</span>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded text-slate-400 hover:text-primary-600 disabled:opacity-30">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 rounded text-slate-400 hover:text-primary-600 disabled:opacity-30">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={onRemove} className="p-1 rounded text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 flex gap-4">
        {/* Imagen */}
        <div className="w-32 shrink-0">
          {pagina.imageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pagina.imageUrl} alt="" className="w-32 h-32 object-contain rounded-xl border border-slate-100 bg-white" />
              <button
                onClick={() => onUpdate({ ...pagina, imageUrl: null, isCustom: false })}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(v => !v)}
              className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
            >
              <Search className="w-6 h-6" />
              <span className="text-[10px] text-center">Agregar imagen</span>
            </button>
          )}
          {!pagina.imageUrl && (
            <label className="mt-1.5 w-full flex items-center justify-center text-[10px] text-slate-400 underline cursor-pointer hover:text-primary-600">
              o subir foto
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
            </label>
          )}
        </div>

        {/* Texto */}
        <div className="flex-1">
          <textarea
            value={pagina.texto}
            onChange={e => onUpdate({ ...pagina, texto: e.target.value })}
            placeholder="Escribe el texto de esta página..."
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 bg-slate-50"
          />
        </div>
      </div>

      {/* Buscador de pictograma */}
      {showSearch && !pagina.imageUrl && (
        <div className="px-4 pb-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="flex gap-2">
              <input
                autoFocus
                type="search"
                placeholder="Buscar pictograma..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button onClick={() => { setShowSearch(false); setQuery('') }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {searching && <p className="text-xs text-slate-400 text-center py-1">Buscando...</p>}
            <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto">
              {results.map(p => (
                <button key={p.id}
                  onClick={() => { onUpdate({ ...pagina, imageUrl: p.imageUrl, isCustom: false }); setShowSearch(false); setQuery('') }}
                  className="flex flex-col items-center gap-0.5 p-1 rounded-lg hover:bg-primary-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.label} className="w-10 h-10 object-contain" />
                  <span className="text-[9px] text-slate-500 text-center line-clamp-2">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistoriasSocialesPage() {
  const [user, setUser] = useState(null)
  const [ninos, setNinos] = useState([])
  const [titulo, setTitulo] = useState('')
  const [paginas, setPaginas] = useState([{ orden: 1, texto: '', imageUrl: null, isCustom: false }])
  const [generating, setGenerating] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [savingNinoId, setSavingNinoId] = useState('')
  const [savingMetaId, setSavingMetaId] = useState('')
  const [savingMetas, setSavingMetas] = useState([])
  const [saving, setSaving] = useState(false)
  const [savedList, setSavedList] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const [listError, setListError] = useState(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (!user) return
      Promise.all([
        sb.from('ninos').select('id, nombre').eq('padre_id', user.id),
        sb.from('equipo_terapeutico').select('nino_id, ninos(id, nombre)').eq('usuario_id', user.id),
      ]).then(([{ data: ninosPadre }, { data: equipo }]) => {
        const all = [...(ninosPadre || []), ...(equipo || []).map(e => e.ninos).filter(Boolean)]
        setNinos(Array.from(new Map(all.map(n => [n.id, n])).values()))
      })
    })
  }, [])

  useEffect(() => {
    if (!savingNinoId) { setSavingMetas([]); setSavingMetaId(''); return }
    createClient().from('metas').select('id, titulo').eq('nino_id', savingNinoId).eq('estado', 'activa').order('created_at', { ascending: false })
      .then(({ data }) => setSavingMetas(data || []))
  }, [savingNinoId])

  const fetchSaved = useCallback(async () => {
    setListError(null)
    try {
      const res = await fetch('/api/historias')
      if (res.ok) setSavedList(await res.json())
      else setListError(`Error ${res.status}`)
    } catch { setListError('No se pudieron cargar las historias') }
  }, [])

  const addPage = () => {
    setPaginas(prev => [...prev, { orden: prev.length + 1, texto: '', imageUrl: null, isCustom: false }])
  }

  const updatePage = (index, data) => {
    setPaginas(prev => prev.map((p, i) => i === index ? data : p))
  }

  const removePage = (index) => {
    setPaginas(prev => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, orden: i + 1 })))
  }

  const movePage = (index, dir) => {
    setPaginas(prev => {
      const arr = [...prev]
      const target = index + dir
      if (target < 0 || target >= arr.length) return prev
      ;[arr[index], arr[target]] = [arr[target], arr[index]]
      return arr.map((p, i) => ({ ...p, orden: i + 1 }))
    })
  }

  const handlePrint = async () => {
    if (!paginas.length) return
    setGenerating(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [215.9, 279.4] })
      const W = 215.9, H = 279.4
      const MARGIN = 15

      for (let i = 0; i < paginas.length; i++) {
        const pagina = paginas[i]
        if (i > 0) doc.addPage()

        // Fondo
        doc.setFillColor(250, 250, 255)
        doc.rect(0, 0, W, H, 'F')

        // Título de historia
        if (titulo) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(16)
          doc.setTextColor(30, 30, 30)
          doc.text(titulo, W / 2, MARGIN + 6, { align: 'center' })
        }

        // Número de página
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(150, 150, 150)
        doc.text(`${i + 1} / ${paginas.length}`, W - MARGIN, H - MARGIN, { align: 'right' })

        const contentY = titulo ? MARGIN + 14 : MARGIN
        const imgH = 100
        const imgW = 120

        // Imagen
        if (pagina.imageUrl) {
          let base64 = pagina.imageUrl
          if (!base64.startsWith('data:')) {
            base64 = await imageUrlToBase64(pagina.imageUrl)
          }
          if (base64) {
            try {
              const fmt = base64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
              const imgX = (W - imgW) / 2
              doc.addImage(base64, fmt, imgX, contentY, imgW, imgH)
            } catch { /* skip */ }
          }
        }

        // Texto
        const textY = contentY + imgH + 8
        if (pagina.texto) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(14)
          doc.setTextColor(30, 30, 30)
          const lines = doc.splitTextToSize(pagina.texto, W - MARGIN * 2)
          doc.text(lines, MARGIN, textY)
        }
      }

      const fecha = new Date().toISOString().split('T')[0]
      const fileName = (titulo || 'historia-social').toLowerCase().replace(/\s+/g, '-')
      doc.save(`${fileName}-${fecha}.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!titulo.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/historias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim(),
          nino_id: savingNinoId || null,
          meta_id: savingMetaId || null,
          paginas: paginas.map(({ orden, texto, imageUrl, isCustom }) => ({ orden, texto, imageUrl, isCustom: !!isCustom })),
        }),
      })
      if (res.ok) {
        setSavingNinoId('')
        setSavingMetaId('')
        setShowSaveForm(false)
      }
    } finally {
      setSaving(false) }
  }

  const handleLoadSaved = (h) => {
    setTitulo(h.titulo)
    setPaginas((Array.isArray(h.paginas) ? h.paginas : []).map((p, i) => ({ ...p, orden: i + 1 })))
    setShowSaved(false)
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
            <h1 className="text-xl font-bold">Historias Sociales</h1>
            <HelpModal
              titulo="¿Cómo usar las Historias Sociales?"
              pasos={[
                'Escribe el título de la historia (ej: "Ir al dentista", "Compartir con amigos").',
                'Agrega páginas: en cada una escribe el texto de ese momento y busca o sube una imagen.',
                'Reordena las páginas con las flechas hasta que la secuencia tenga sentido.',
                'Descarga el PDF para leerlo con el niño antes de la situación real.',
              ]}
              ejemplo="Sofía tiene miedo al dentista. Su terapeuta crea una historia de 4 páginas: 1) 'Voy al dentista con mamá.' 2) 'Me siento en la silla grande.' 3) 'El doctor revisa mis dientes.' 4) '¡Terminé! Me dieron una calcomanía.' Sofía la lee varias veces antes de la cita y llega más tranquila."
            />
          </div>
          <p className="text-primary-100 text-sm mt-0.5">
            Crea narrativas visuales para enseñar situaciones sociales paso a paso
          </p>
        </div>

        <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">

          {/* Título + acciones */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Título de la historia (ej: Ir al colegio)"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-800 focus:outline-none focus:border-primary-400 bg-white"
            />
            <button
              onClick={() => { setShowSaved(v => !v); if (!showSaved) fetchSaved() }}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-primary-600 hover:border-primary-300 transition-colors"
              title="Historias guardadas"
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de historias guardadas */}
          {showSaved && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Historias guardadas</p>
              {listError ? <p className="text-xs text-red-500">{listError}</p>
                : savedList.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-slate-400">
                    <BookmarkX className="w-8 h-8 mb-1" />
                    <p className="text-xs">Sin historias guardadas</p>
                  </div>
                ) : savedList.map(h => (
                  <button key={h.id} onClick={() => handleLoadSaved(h)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary-50 border border-transparent hover:border-primary-200 text-left transition-colors">
                    <span className="text-2xl shrink-0">📖</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{h.titulo}</p>
                      <p className="text-xs text-slate-400">
                        {Array.isArray(h.paginas) ? h.paginas.length : 0} páginas
                        {h.nino_nombre && ` · ${h.nino_nombre}`}
                      </p>
                    </div>
                  </button>
                ))
              }
            </div>
          )}

          {/* Páginas */}
          <div className="space-y-3">
            {paginas.map((pagina, index) => (
              <PageEditor
                key={index}
                pagina={pagina}
                index={index}
                total={paginas.length}
                onUpdate={(data) => updatePage(index, data)}
                onRemove={() => removePage(index)}
                onMoveUp={() => movePage(index, -1)}
                onMoveDown={() => movePage(index, 1)}
              />
            ))}
          </div>

          {/* Agregar página */}
          <button
            onClick={addPage}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" /> Agregar página
          </button>

          {/* Botones acción */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handlePrint}
              disabled={generating || paginas.length === 0}
            >
              <Printer className="w-4 h-4" />
              {generating ? 'Generando...' : 'Descargar PDF'}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => setShowSaveForm(v => !v)}
              disabled={!titulo.trim()}
            >
              <Bookmark className="w-4 h-4" /> Guardar
            </Button>
          </div>

          {/* Formulario de guardado */}
          {showSaveForm && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Guardar historia</p>
              {ninos.length > 0 && (
                <Select value={savingNinoId} onChange={e => setSavingNinoId(e.target.value)}>
                  <option value="">Sin asociar a un niño</option>
                  {ninos.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </Select>
              )}
              {savingNinoId && savingMetas.length > 0 && (
                <Select value={savingMetaId} onChange={e => setSavingMetaId(e.target.value)}>
                  <option value="">Sin vincular a una meta</option>
                  {savingMetas.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
                </Select>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowSaveForm(false)} className="flex-1">Cancelar</Button>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
