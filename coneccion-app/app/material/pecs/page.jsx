'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { PictogramGrid } from '@/components/pecs/PictogramGrid'
import { CategoryBrowser } from '@/components/pecs/CategoryBrowser'
import { SelectionTray } from '@/components/pecs/SelectionTray'
import { PrintSettings } from '@/components/pecs/PrintSettings'
import { CustomUpload } from '@/components/pecs/CustomUpload'
import { QuickStart } from '@/components/pecs/QuickStart'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { imageUrlToBase64, generarPECSPDF } from '@/lib/pecs-pdf'
import { Zap, Search, LayoutGrid, Bookmark, BookmarkX, Trash2, ChevronLeft } from 'lucide-react'
import { Select } from '@/components/ui/Input'

const TABS = [
  { id: 'rapido',     label: 'Inicio rápido',  icon: Zap },
  { id: 'buscar',     label: 'Buscar',         icon: Search },
  { id: 'categorias', label: 'Categorías',     icon: LayoutGrid },
  { id: 'guardados',  label: 'Sets guardados', icon: Bookmark },
]

const DEFAULT_PRINT_SETTINGS = {
  paperSize: 'carta',
  pictoSize: '5x5',
  showBorder: true,
  showLabel: true,
}

export default function PecsPage() {
  const [user, setUser]                   = useState(null)
  const [ninos, setNinos]                 = useState([])
  const [activeTab, setActiveTab]         = useState('rapido')
  const [query, setQuery]                 = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [pictograms, setPictograms]       = useState([])
  const [loading, setLoading]             = useState(false)
  const [selected, setSelected]           = useState([])
  const [selectedIds, setSelectedIds]     = useState(new Set())
  const [showPrintSettings, setShowPrintSettings] = useState(false)
  const [printSettings, setPrintSettings] = useState(DEFAULT_PRINT_SETTINGS)
  const [generating, setGenerating]       = useState(false)
  const [savedSets, setSavedSets]         = useState([])
  const [setsError, setSetsError]         = useState(null)
  const [savingName, setSavingName]       = useState('')
  const [savingNinoId, setSavingNinoId]   = useState('')
  const [savingMetaId, setSavingMetaId]   = useState('')
  const [savingMetas, setSavingMetas]     = useState([])
  const [showSaveForm, setShowSaveForm]   = useState(false)
  const [saving, setSaving]               = useState(false)
  const [loadingCategory, setLoadingCategory] = useState(null)
  const debounceRef  = useRef(null)
  const saveInputRef = useRef(null)

  // ── Cargar usuario y sus niños ───────────────────────────────────────────
  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (!user) return
      Promise.all([
        sb.from('ninos').select('id, nombre').eq('padre_id', user.id),
        sb.from('equipo_terapeutico').select('nino_id, ninos(id, nombre)').eq('usuario_id', user.id),
      ]).then(([{ data: ninosPadre }, { data: equipo }]) => {
        const all = [
          ...(ninosPadre || []),
          ...(equipo || []).map(e => e.ninos).filter(Boolean),
        ]
        const unique = Array.from(new Map(all.map(n => [n.id, n])).values())
        setNinos(unique)
      })
    })
  }, [])

  // ── Cargar sets guardados ────────────────────────────────────────────────
  const fetchSavedSets = useCallback(async () => {
    setSetsError(null)
    try {
      const res = await fetch('/api/pecs/sets')
      if (res.ok) {
        setSavedSets(await res.json())
      } else {
        const body = await res.json().catch(() => ({}))
        setSetsError(body.error || `Error ${res.status}`)
      }
    } catch (e) {
      setSetsError('No se pudieron cargar los sets')
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'guardados') fetchSavedSets()
  }, [activeTab, fetchSavedSets])

  // ── Cargar metas activas del niño seleccionado (formulario guardar) ──────
  useEffect(() => {
    if (!savingNinoId) { setSavingMetas([]); setSavingMetaId(''); return }
    const sb = createClient()
    sb.from('metas')
      .select('id, titulo, area')
      .eq('nino_id', savingNinoId)
      .eq('estado', 'activa')
      .order('created_at', { ascending: false })
      .then(({ data }) => setSavingMetas(data || []))
  }, [savingNinoId])

  // ── Búsqueda con debounce ────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'buscar') return
    if (!query.trim()) { setPictograms([]); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/pecs/search?q=${encodeURIComponent(query)}&category=${activeCategory || 'atributos'}`)
        if (res.ok) setPictograms(await res.json())
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query, activeTab, activeCategory])

  // ── Cargar categoría ─────────────────────────────────────────────────────
  const handleCategorySelect = async (catId) => {
    setActiveCategory(catId)
    if (activeTab === 'buscar') return

    if (!catId) { setPictograms([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/pecs/category?categoryId=${catId}`)
      if (res.ok) setPictograms(await res.json())
    } finally {
      setLoading(false)
    }
  }

  // ── Toggle selección ─────────────────────────────────────────────────────
  const handleToggle = useCallback((picto) => {
    const id = String(picto.id)
    setSelected(s => {
      const exists = s.some(p => String(p.id) === id)
      return exists ? s.filter(p => String(p.id) !== id) : [...s, picto]
    })
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleRemove = useCallback((id) => {
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    setSelected(s => s.filter(p => String(p.id) !== id))
  }, [])

  const handleClear = () => {
    setSelected([])
    setSelectedIds(new Set())
  }

  // ── Añadir pictograma personalizado ──────────────────────────────────────
  const handleCustomAdd = (picto) => {
    const id = String(picto.id)
    if (selectedIds.has(id)) return
    setSelected(s => [...s, picto])
    setSelectedIds(prev => new Set([...prev, id]))
  }

  // ── Generar PDF ──────────────────────────────────────────────────────────
  const handleGeneratePDF = async () => {
    if (!selected.length) return
    setGenerating(true)
    try {
      const withBase64 = await Promise.all(
        selected.map(async (picto) => {
          if (picto.base64) return picto
          const base64 = await imageUrlToBase64(picto.imageUrl)
          return { ...picto, base64 }
        })
      )
      generarPECSPDF({
        pictograms: withBase64,
        ...printSettings,
        fileName: 'pictogramas-pecs',
      })
    } finally {
      setGenerating(false)
      setShowPrintSettings(false)
    }
  }

  // ── Guardar set ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!savingName.trim() || !selected.length) return
    setSaving(true)
    try {
      const pictogram_ids = selected.map(({ id, label, category, imageUrl, isCustom }) => ({
        id: String(id), label, category, imageUrl, isCustom: !!isCustom,
      }))
      const res = await fetch('/api/pecs/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: savingName.trim(),
          nino_id: savingNinoId || null,
          meta_id: savingMetaId || null,
          pictogram_ids,
        }),
      })
      if (res.ok) {
        setSavingName('')
        setSavingNinoId('')
        setSavingMetaId('')
        setSavingMetas([])
        setShowSaveForm(false)
        await fetchSavedSets()
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar set guardado ─────────────────────────────────────────────────
  const handleDeleteSet = async (id) => {
    await fetch(`/api/pecs/sets?id=${id}`, { method: 'DELETE' })
    setSavedSets(s => s.filter(set => set.id !== id))
  }

  // ── Inicio rápido: cargar toda una categoría al tray ─────────────────────
  const handleQuickLoadCategory = async (catId) => {
    setLoadingCategory(catId)
    try {
      const res = await fetch(`/api/pecs/category?categoryId=${catId}`)
      if (!res.ok) return
      const pictos = await res.json()
      setSelected(prev => {
        const existingIds = new Set(prev.map(p => String(p.id)))
        const toAdd = pictos.filter(p => !existingIds.has(String(p.id)))
        return [...prev, ...toAdd]
      })
      setSelectedIds(prev => {
        const next = new Set(prev)
        pictos.forEach(p => next.add(String(p.id)))
        return next
      })
    } finally {
      setLoadingCategory(null)
    }
  }

  // ── Cargar set guardado → agrega al tray ─────────────────────────────────
  const handleLoadSet = (set) => {
    const pictos = Array.isArray(set.pictogram_ids) ? set.pictogram_ids : []
    setSelected(prev => {
      const existingIds = new Set(prev.map(p => String(p.id)))
      const toAdd = pictos.filter(p => !existingIds.has(String(p.id)))
      return [...prev, ...toAdd]
    })
    setSelectedIds(prev => {
      const next = new Set(prev)
      pictos.forEach(p => next.add(String(p.id)))
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0 flex flex-col">
        {/* Encabezado con breadcrumb */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-5 shrink-0">
          <Link
            href="/material"
            className="inline-flex items-center gap-1 text-primary-200 hover:text-white text-xs mb-2 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Material
          </Link>
          <h1 className="text-xl font-bold">Generador de PECS</h1>
          <p className="text-primary-100 text-sm mt-0.5">
            Selecciona pictogramas y genera hojas imprimibles para comunicación aumentativa
          </p>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Columna principal */}
          <div className="flex-1 overflow-auto p-4 space-y-4">

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 w-full">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">{label}</span>
                </button>
              ))}
            </div>

            {/* Tab: Inicio rápido */}
            {activeTab === 'rapido' && (
              <QuickStart
                onLoadCategory={handleQuickLoadCategory}
                loadingCategory={loadingCategory}
              />
            )}

            {/* Tab: Buscar */}
            {activeTab === 'buscar' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Buscar pictograma (ej: manzana, caminar, feliz...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-slate-400 bg-white"
                  />
                </div>
                <PictogramGrid
                  pictograms={pictograms}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                  loading={loading}
                />
              </div>
            )}

            {/* Tab: Categorías */}
            {activeTab === 'categorias' && (
              <div className="space-y-4">
                <CategoryBrowser activeCategory={activeCategory} onSelect={handleCategorySelect} />
                {activeCategory ? (
                  <PictogramGrid
                    pictograms={pictograms}
                    selectedIds={selectedIds}
                    onToggle={handleToggle}
                    loading={loading}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <LayoutGrid className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">Selecciona una categoría para ver sus pictogramas</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Sets guardados */}
            {activeTab === 'guardados' && (
              <div className="space-y-3">
                {setsError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-2">
                    <p className="text-sm font-medium">Error al cargar sets</p>
                    <p className="text-xs text-slate-400">{setsError}</p>
                    <button onClick={fetchSavedSets} className="text-xs text-primary-600 underline mt-1">
                      Reintentar
                    </button>
                  </div>
                ) : savedSets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <BookmarkX className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">No tienes sets guardados aún</p>
                  </div>
                ) : (
                  savedSets.map((set) => (
                    <div key={set.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 truncate">{set.nombre}</p>
                          {!set.es_propio && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 shrink-0">
                              del equipo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {Array.isArray(set.pictogram_ids) ? set.pictogram_ids.length : 0} pictogramas ·{' '}
                          {new Date(set.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                          {set.nino_nombre && ` · ${set.nino_nombre}`}
                        </p>
                        {!set.es_propio && set.creador_nombre && (
                          <p className="text-xs text-violet-600 mt-0.5">Creado por {set.creador_nombre}</p>
                        )}
                        <div className="flex gap-1 mt-2 overflow-hidden">
                          {(Array.isArray(set.pictogram_ids) ? set.pictogram_ids : []).slice(0, 6).map((p, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={p.imageUrl} alt={p.label} className="w-8 h-8 object-contain rounded border border-slate-100 bg-white" />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="secondary" onClick={() => handleLoadSet(set)}>
                          Cargar
                        </Button>
                        {set.es_propio && (
                          <button
                            onClick={() => handleDeleteSet(set.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Subir imagen personalizada */}
            <CustomUpload onAdd={handleCustomAdd} />
          </div>

          {/* Panel lateral de selección */}
          <div className="lg:w-80 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-sm">Mi set</h2>
              {selected.length > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">
                  {selected.length} pictograma{selected.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <SelectionTray
              selected={selected}
              onRemove={handleRemove}
              onClear={handleClear}
              onPrint={() => setShowPrintSettings(true)}
              onSave={() => {
                setShowSaveForm(true)
                // Pequeño delay para que el DOM monte el input antes de hacer focus
                setTimeout(() => {
                  saveInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  saveInputRef.current?.focus()
                }, 80)
              }}
              generating={generating}
            />

            {/* Formulario guardar set */}
            {showSaveForm && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">Guardar este set</p>
                <Input
                  ref={saveInputRef}
                  placeholder="Nombre del set (ej: Rutina mañana)"
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                />
                {ninos.length > 0 && (
                  <Select value={savingNinoId} onChange={(e) => setSavingNinoId(e.target.value)}>
                    <option value="">Sin asociar a un niño</option>
                    {ninos.map(n => (
                      <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                  </Select>
                )}
                {savingNinoId && savingMetas.length > 0 && (
                  <Select value={savingMetaId} onChange={(e) => setSavingMetaId(e.target.value)}>
                    <option value="">Sin vincular a una meta</option>
                    {savingMetas.map(m => (
                      <option key={m.id} value={m.id}>{m.titulo}</option>
                    ))}
                  </Select>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowSaveForm(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={!savingName.trim() || saving}
                    className="flex-1"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal configuración PDF */}
      {showPrintSettings && (
        <PrintSettings
          settings={printSettings}
          onChange={setPrintSettings}
          onConfirm={handleGeneratePDF}
          onClose={() => setShowPrintSettings(false)}
          generating={generating}
        />
      )}
    </div>
  )
}
