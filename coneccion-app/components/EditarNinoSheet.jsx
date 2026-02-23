'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { X, Save, Loader2, CheckCircle2, Pencil } from 'lucide-react'

/**
 * EditarNinoTrigger — Client Component que gestiona el estado open/close.
 * Úsalo en Server Components en lugar de EditarNinoSheet directamente.
 */
export function EditarNinoTrigger({ nino }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="shrink-0 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-1.5"
      >
        <Pencil className="w-3.5 h-3.5" />
        Editar
      </Button>
      <EditarNinoSheet nino={nino} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/**
 * EditarNinoSheet
 * Bottom-sheet (mobile) / Side-panel (desktop) para editar el perfil del niño.
 * Uso: <EditarNinoSheet nino={nino} open={open} onClose={() => setOpen(false)} />
 */
export function EditarNinoSheet({ nino, open, onClose }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const firstInputRef = useRef(null)

  const [form, setForm] = useState({
    nombre:            nino.nombre            || '',
    apellido:          nino.apellido          || '',
    fecha_nacimiento:  nino.fecha_nacimiento  || '',
    diagnostico:       nino.diagnostico       || '',
    notas_adicionales: nino.notas_adicionales || '',
  })

  // Foco automático al abrir
  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 150)
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('El nombre y apellido son obligatorios.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('ninos')
      .update({
        nombre:            form.nombre.trim(),
        apellido:          form.apellido.trim(),
        fecha_nacimiento:  form.fecha_nacimiento || null,
        diagnostico:       form.diagnostico.trim() || null,
        notas_adicionales: form.notas_adicionales.trim() || null,
      })
      .eq('id', nino.id)

    setLoading(false)

    if (dbError) {
      setError('No se pudo guardar. Intenta de nuevo.')
      return
    }

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setOpen(false)
      router.refresh()
    }, 1200)
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel: bottom-sheet en mobile, sidebar derecho en desktop */}
      <div className={`
        fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-out
        /* mobile: bottom sheet */
        bottom-0 left-0 right-0 rounded-t-3xl max-h-[92dvh] overflow-y-auto
        /* desktop: side panel */
        md:bottom-auto md:top-0 md:right-0 md:left-auto md:h-full md:w-[420px] md:rounded-none md:rounded-l-3xl
        ${open
          ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
          : 'translate-y-full md:translate-y-0 md:translate-x-full'
        }
      `}>

        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Editar perfil</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {nino.nombre} {nino.apellido}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center 
                       bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 pb-10">

          <div className="grid grid-cols-2 gap-3">
            <Input
              ref={firstInputRef}
              label="Nombre *"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Sofía"
              required
            />
            <Input
              label="Apellido *"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              placeholder="Ej: García"
              required
            />
          </div>

          <Input
            label="Fecha de nacimiento"
            name="fecha_nacimiento"
            type="date"
            value={form.fecha_nacimiento}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Diagnóstico
            </label>
            <Input
              name="diagnostico"
              value={form.diagnostico}
              onChange={handleChange}
              placeholder="Ej: TEA nivel 1, TDAH, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notas adicionales
            </label>
            <Textarea
              name="notas_adicionales"
              value={form.notas_adicionales}
              onChange={handleChange}
              placeholder="Información relevante para el equipo..."
              rows={4}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={loading || saved}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Guardado
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </>
  )
}