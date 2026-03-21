'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PECS_CATEGORIES } from './constants'

export function CustomUpload({ onAdd }) {
  const [label, setLabel]       = useState('')
  const [category, setCategory] = useState('custom')
  const [preview, setPreview]   = useState(null)
  const [base64, setBase64]     = useState(null)
  const inputRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
      setBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleAdd = () => {
    if (!base64 || !label.trim()) return
    onAdd({
      id: `custom-${Date.now()}`,
      label: label.trim(),
      category: category === 'custom' ? 'atributos' : category,
      imageUrl: base64,
      base64,
      isCustom: true,
    })
    setLabel('')
    setPreview(null)
    setBase64(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <p className="text-sm font-semibold text-slate-700">Subir imagen personalizada</p>
      <div className="flex gap-3 items-end flex-wrap sm:flex-nowrap">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="preview"
            className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white shrink-0"
          />
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors shrink-0"
          >
            <Upload className="w-6 h-6" />
          </button>
        )}

        <div className="flex-1 space-y-2 min-w-0">
          <Input
            placeholder="Etiqueta del pictograma"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="custom">Sin categoría específica</option>
            {PECS_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </Select>
        </div>

        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!base64 || !label.trim()}
          className="shrink-0"
        >
          Añadir
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
