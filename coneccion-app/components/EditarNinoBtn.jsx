'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, X, Save, Loader2, CheckCircle2 } from 'lucide-react'

const Field = ({ label, name, value, onChange, type = 'text', placeholder, inputRef }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      ref={inputRef}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    />
  </div>
)

function TextArea({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  )
}

export function EditarNinoBtn({ nino }) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')
  const firstRef = useRef(null)

  const [form, setForm] = useState({
    nombre:            nino.nombre            ?? '',
    apellido:          nino.apellido          ?? '',
    fecha_nacimiento:  nino.fecha_nacimiento  ?? '',
    diagnostico:       nino.diagnostico       ?? '',
    notas_adicionales: nino.notas_adicionales ?? '',
  })

  const onChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const close = () => setOpen(false)

  useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 150)
  }, [open])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: dbErr } = await supabase
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
    if (dbErr) { setError('No se pudo guardar. Intenta de nuevo.'); return }
    setSaved(true)
    setTimeout(() => { setSaved(false); close(); router.refresh() }, 1200)
  }

  return (
    <>
      {/* ── Botón trigger ── */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                   border border-white/30 bg-white/10 text-white
                   hover:bg-white/20 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        Editar
      </button>

      {/* ── Overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* ── Panel: bottom-sheet mobile / side-panel desktop ── */}
      <div className={`
        fixed z-50 bg-white shadow-2xl
        bottom-0 left-0 right-0 rounded-t-3xl max-h-[92dvh] overflow-y-auto
        md:bottom-auto md:top-0 md:right-0 md:left-auto md:h-full md:w-[420px] md:rounded-none md:rounded-l-3xl
        transition-transform duration-300 ease-out
        ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}
      `}>

        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between
                        px-5 py-4 bg-white border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Editar perfil</h2>
            <p className="text-xs text-slate-400 mt-0.5">{nino.nombre} {nino.apellido}</p>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full flex items-center justify-center
                       bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 pb-10">
          <div className="grid grid-cols-2 gap-3">
            <Field inputRef={firstRef} label="Nombre *" name="nombre" value={form.nombre}
              onChange={onChange} placeholder="Ej: Sofía" />
            <Field label="Apellido *" name="apellido" value={form.apellido}
              onChange={onChange} placeholder="Ej: García" />
          </div>

          <Field label="Fecha de nacimiento" name="fecha_nacimiento" type="date"
            value={form.fecha_nacimiento} onChange={onChange} />

          <Field label="Diagnóstico" name="diagnostico" value={form.diagnostico}
            onChange={onChange} placeholder="Ej: TEA nivel 1, TDAH…" />

          <TextArea label="Notas adicionales" name="notas_adicionales"
            value={form.notas_adicionales} onChange={onChange}
            placeholder="Información relevante para el equipo…" />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={close} disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium
                         text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading || saved}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                         bg-primary-600 text-white text-sm font-medium
                         hover:bg-primary-700 disabled:opacity-60 transition-colors">
              {saved    ? <><CheckCircle2 className="w-4 h-4" /> Guardado</>
               : loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
               :           <><Save className="w-4 h-4" /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}