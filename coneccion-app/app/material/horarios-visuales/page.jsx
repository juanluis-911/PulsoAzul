'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { PictogramGrid } from '@/components/pecs/PictogramGrid'
import { CategoryBrowser } from '@/components/pecs/CategoryBrowser'
import { CustomUpload } from '@/components/pecs/CustomUpload'
import { ScheduleList } from '@/components/horarios/ScheduleList'
import { HorarioSettings } from '@/components/horarios/HorarioSettings'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { imageUrlToBase64, generarHorarioPDF } from '@/lib/horarios-pdf'
import { ChevronLeft, Search, LayoutGrid, Bookmark, BookmarkX, Trash2, Zap } from 'lucide-react'
import { HelpModal } from '@/components/ui/HelpModal'
import { PECS_CATEGORIES } from '@/components/pecs/constants'

const TABS = [
  { id: 'rapido',     label: 'Inicio rápido', icon: Zap },
  { id: 'buscar',     label: 'Buscar',        icon: Search },
  { id: 'categorias', label: 'Categorías',    icon: LayoutGrid },
  { id: 'guardados',  label: 'Guardados',     icon: Bookmark },
]

const DEFAULT_PRINT = {
  layout:     'lista',
  paperSize:  'carta',
  pictoSize:  '5x5',
  showLabel:  true,
}

export default function HorariosVisualesPage() {
  const [user, setUser]                   = useState(null)
  const [ninos, setNinos]                 = useState([])
  const [activeTab, setActiveTab]         = useState('rapido')
  const [query, setQuery]                 = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [pictograms, setPictograms]       = useState([])
  const [loading, setLoading]             = useState(false)
  const [loadingCategory, setLoadingCategory] = useState(null)

  // Horario en construcción
  const [actividades, setActividades]     = useState([])
  const [mostrarHoras, setMostrarHoras]   = useState(false)

  // PDF
  const [showPrint, setShowPrint]         = useState(false)
  const [printSettings, setPrintSettings] = useState(DEFAULT_PRINT)
  const [generating, setGenerating]       = useState(false)

  // Guardar
  const [showSaveForm, setShowSaveForm]   = useState(false)
  const [savingName, setSavingName]       = useState('')
  const [savingNinoId, setSavingNinoId]   = useState('')
  const [savingMetaId, setSavingMetaId]   = useState('')
  const [savingMetas, setSavingMetas]     = useState([])
  const [saving, setSaving]               = useState(false)
  const [savedList, setSavedList]         = useState([])
  const [listError, setListError]         = useState(null)
  const saveInputRef = useRef(null)
  const debounceRef  = useRef(null)

  // ── Cargar usuario y niños ──────────────────────────────────────────────
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
        setNinos(Array.from(new Map(all.map(n => [n.id, n])).values()))
      })
    })
  }, [])

  // ── Cargar horarios guardados ───────────────────────────────────────────
  const fetchSaved = useCallback(async () => {
    setListError(null)
    try {
      const res = await fetch('/api/horarios')
      if (res.ok) setSavedList(await res.json())
      else setListError(`Error ${res.status}`)
    } catch {
      setListError('No se pudieron cargar los horarios')
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'guardados') fetchSaved()
  }, [activeTab, fetchSaved])

  // ── Cargar metas activas del niño seleccionado ─────────────────────────
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

  // ── Búsqueda con debounce ───────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'buscar') return
    if (!query.trim()) { setPictograms([]); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/pecs/search?q=${encodeURIComponent(query)}`)
        if (res.ok) setPictograms(await res.json())
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query, activeTab])

  // ── Cargar categoría ────────────────────────────────────────────────────
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

  // ── Inicio rápido: cargar categoría entera ─────────────────────────────
  const handleQuickLoad = async (catId) => {
    setLoadingCategory(catId)
    try {
      const res = await fetch(`/api/pecs/category?categoryId=${catId}`)
      if (!res.ok) return
      const pictos = await res.json()
      setActividades(prev => {
        const existingIds = new Set(prev.map(a => a.pictogram_id))
        const nuevas = pictos
          .filter(p => !existingIds.has(String(p.id)))
          .map((p, i) => ({
            orden: prev.length + i + 1,
            pictogram_id: String(p.id),
            label: p.label,
            hora: '',
            imageUrl: p.imageUrl,
            category: p.category,
            isCustom: false,
          }))
        return [...prev, ...nuevas]
      })
    } finally {
      setLoadingCategory(null)
    }
  }

  // ── Agregar pictograma al horario ───────────────────────────────────────
  const handleAdd = useCallback((picto) => {
    setActividades(prev => [
      ...prev,
      {
        orden:        prev.length + 1,
        pictogram_id: String(picto.id),
        label:        picto.label,
        hora:         '',
        imageUrl:     picto.imageUrl,
        category:     picto.category,
        isCustom:     !!picto.isCustom,
      },
    ])
  }, [])

  // ── Reordenar ───────────────────────────────────────────────────────────
  const handleMoveUp = (index) => {
    if (index === 0) return
    setActividades(prev => {
      const arr = [...prev]
      ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
      return arr.map((a, i) => ({ ...a, orden: i + 1 }))
    })
  }

  const handleMoveDown = (index) => {
    setActividades(prev => {
      if (index === prev.length - 1) return prev
      const arr = [...prev]
      ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
      return arr.map((a, i) => ({ ...a, orden: i + 1 }))
    })
  }

  const handleRemove = (index) => {
    setActividades(prev => prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, orden: i + 1 })))
  }

  const handleHoraChange = (index, hora) => {
    setActividades(prev => prev.map((a, i) => i === index ? { ...a, hora } : a))
  }

  const handleClear = () => setActividades([])

  // ── Generar PDF ─────────────────────────────────────────────────────────
  const handleGeneratePDF = async () => {
    if (!actividades.length) return
    setGenerating(true)
    try {
      const withBase64 = await Promise.all(
        actividades.map(async (act) => {
          if (act.base64) return act
          const base64 = await imageUrlToBase64(act.imageUrl)
          return { ...act, base64 }
        })
      )
      generarHorarioPDF({
        actividades: withBase64,
        nombre: savingName || 'Horario Visual',
        mostrarHoras,
        ...printSettings,
      })
    } finally {
      setGenerating(false)
      setShowPrint(false)
    }
  }

  // ── Guardar horario ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!savingName.trim() || !actividades.length) return
    setSaving(true)
    try {
      const payload = {
        nombre:        savingName.trim(),
        nino_id:       savingNinoId || null,
        meta_id:       savingMetaId || null,
        tipo:          'dia_completo',
        mostrar_horas: mostrarHoras,
        actividades:   actividades.map(({ orden, pictogram_id, label, hora, imageUrl, category, isCustom }) => ({
          orden, pictogram_id, label, hora, imageUrl, category, isCustom: !!isCustom,
        })),
      }
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSavingName('')
        setSavingNinoId('')
        setSavingMetaId('')
        setSavingMetas([])
        setShowSaveForm(false)
        await fetchSaved()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSaved = async (id) => {
    await fetch(`/api/horarios?id=${id}`, { method: 'DELETE' })
    setSavedList(prev => prev.filter(h => h.id !== id))
  }

  const handleLoadSaved = (horario) => {
    const acts = Array.isArray(horario.actividades) ? horario.actividades : []
    setActividades(acts.map((a, i) => ({ ...a, orden: i + 1 })))
    setMostrarHoras(!!horario.mostrar_horas)
  }

  // ── IDs ya en el horario (para resaltar en el grid) ─────────────────────
  const selectedIds = new Set(actividades.map(a => a.pictogram_id))

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0 flex flex-col">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-5 shrink-0">
          <Link
            href="/material"
            className="inline-flex items-center gap-1 text-primary-200 hover:text-white text-xs mb-2 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Material
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Horarios Visuales</h1>
            <HelpModal
              titulo="¿Cómo usar los Horarios Visuales?"
              pasos={[
                'Busca pictogramas o carga una categoría completa.',
                'Haz clic en cada actividad para agregarla a la secuencia.',
                'Reordena con las flechas ↑↓ y activa "Mostrar horas" si lo necesitas.',
                'Descarga el PDF como lista vertical (con horas) o tira horizontal (para pegar en la pared).',
              ]}
              ejemplo="María tiene ansiedad por los cambios de rutina. Su terapeuta crea un horario visual de su mañana: despertar → cepillarse → desayunar → vestirse → ir al colegio. Al ver los pictogramas ordenados, María sabe qué viene después y reduce su angustia."
            />
          </div>
          <p className="text-primary-100 text-sm mt-0.5">
            Crea secuencias visuales de actividades y genera hojas imprimibles
          </p>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* ── Columna izquierda: browser ─────────────────────────────── */}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PECS_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleQuickLoad(cat.id)}
                    disabled={loadingCategory === cat.id}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${cat.tailwind} hover:shadow-md disabled:opacity-60`}
                  >
                    <span className="text-3xl">{cat.emoji}</span>
                    <span className="text-sm font-semibold">{cat.label}</span>
                    {loadingCategory === cat.id && (
                      <span className="text-xs animate-pulse">Cargando...</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Tab: Buscar */}
            {activeTab === 'buscar' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Buscar pictograma (ej: desayuno, dormir, colegio...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-slate-400 bg-white"
                  />
                </div>
                <PictogramGrid
                  pictograms={pictograms}
                  selectedIds={selectedIds}
                  onToggle={handleAdd}
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
                    onToggle={handleAdd}
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

            {/* Tab: Guardados */}
            {activeTab === 'guardados' && (
              <div className="space-y-3">
                {listError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-2">
                    <p className="text-sm font-medium">Error al cargar horarios</p>
                    <button onClick={fetchSaved} className="text-xs text-primary-600 underline">
                      Reintentar
                    </button>
                  </div>
                ) : savedList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <BookmarkX className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">No tienes horarios guardados aún</p>
                  </div>
                ) : (
                  savedList.map((horario) => (
                    <div key={horario.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 truncate">{horario.nombre}</p>
                          {!horario.es_propio && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 shrink-0">
                              del equipo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {Array.isArray(horario.actividades) ? horario.actividades.length : 0} actividades ·{' '}
                          {new Date(horario.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                          {horario.nino_nombre && ` · ${horario.nino_nombre}`}
                        </p>
                        <div className="flex gap-1 mt-2 overflow-hidden">
                          {(Array.isArray(horario.actividades) ? horario.actividades : []).slice(0, 6).map((a, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={a.imageUrl} alt={a.label} className="w-8 h-8 object-contain rounded border border-slate-100 bg-white" />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="secondary" onClick={() => handleLoadSaved(horario)}>
                          Cargar
                        </Button>
                        {horario.es_propio && (
                          <button
                            onClick={() => handleDeleteSaved(horario.id)}
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
            <CustomUpload onAdd={handleAdd} />
          </div>

          {/* ── Panel derecho: secuencia ────────────────────────────────── */}
          <div className="lg:w-80 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <ScheduleList
              actividades={actividades}
              mostrarHoras={mostrarHoras}
              onToggleMostrarHoras={() => setMostrarHoras(v => !v)}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onRemove={handleRemove}
              onHoraChange={handleHoraChange}
              onClear={handleClear}
              onPrint={() => setShowPrint(true)}
              onSave={() => {
                setShowSaveForm(true)
                setTimeout(() => {
                  saveInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  saveInputRef.current?.focus()
                }, 80)
              }}
              generating={generating}
            />

            {/* Formulario guardar */}
            {showSaveForm && (
              <div className="mt-3 space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                <p className="text-sm font-semibold text-slate-700">Guardar este horario</p>
                <Input
                  ref={saveInputRef}
                  placeholder="Nombre (ej: Rutina mañana)"
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
      {showPrint && (
        <HorarioSettings
          settings={printSettings}
          onChange={setPrintSettings}
          onConfirm={handleGeneratePDF}
          onClose={() => setShowPrint(false)}
          generating={generating}
        />
      )}
    </div>
  )
}
