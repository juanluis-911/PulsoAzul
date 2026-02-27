'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Send, MessageCircle, AlertTriangle, Stethoscope,
  ChevronDown, ChevronUp, Paperclip, X, FileText, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROL_LABEL = {
  padre:          { label: 'Padre/Madre', color: 'bg-violet-100 text-violet-700' },
  maestra_sombra: { label: 'Maestra',     color: 'bg-sky-100 text-sky-700' },
  terapeuta:      { label: 'Terapeuta',   color: 'bg-emerald-100 text-emerald-700' },
}

const TIPO_CONFIG = {
  texto:        { icon: null,          label: '',             bubble: '' },
  nota_clinica: { icon: Stethoscope,   label: 'Nota clínica', bubble: 'border-l-2 border-emerald-400' },
  alerta:       { icon: AlertTriangle, label: 'Alerta',       bubble: 'border-l-2 border-amber-400' },
}

const EMOJIS      = ['👍', '❤️', '😂', '😢', '😮', '👏']
const MAX_SIZE_MB  = 10
const PAGE_SIZE    = 30   // mensajes por página

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatFecha(iso) {
  const d    = new Date(iso)
  const hoy  = new Date()
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString())  return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}

function agruparPorFecha(msgs) {
  const grupos = []; let fechaActual = null
  msgs.forEach(m => {
    const f = new Date(m.created_at).toDateString()
    if (f !== fechaActual) {
      fechaActual = f
      grupos.push({ tipo: 'separador', fecha: m.created_at, id: `sep-${m.created_at}` })
    }
    grupos.push(m)
  })
  return grupos
}

function agruparReacciones(reacciones) {
  const map = {}
  reacciones?.forEach(r => { if (!map[r.emoji]) map[r.emoji] = []; map[r.emoji].push(r) })
  return map
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Visor de imagen ──────────────────────────────────────────────────────────

function VisorImagen({ url, nombre, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', fn) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center" onClick={onClose}>
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3
                      bg-gradient-to-b from-black/60 to-transparent">
        <p className="text-white text-sm font-medium truncate max-w-[70%]">{nombre}</p>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" download={nombre}
            onClick={e => e.stopPropagation()}
            className="text-white/70 hover:text-white text-xs border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors">
            Descargar
          </a>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      <img src={url} alt={nombre} onClick={e => e.stopPropagation()}
        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
    </div>
  )
}

// ─── Preview adjunto antes de enviar ─────────────────────────────────────────

function AdjuntoPreview({ archivo, onRemove }) {
  const esImagen = archivo.type.startsWith('image/')
  const [previewUrl] = useState(() => esImagen ? URL.createObjectURL(archivo) : null)
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mx-3 mb-1">
      {esImagen
        ? <img src={previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
        : <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-red-500" />
          </div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{archivo.name}</p>
        <p className="text-[11px] text-slate-400">{formatBytes(archivo.size)}</p>
      </div>
      <button onClick={onRemove} className="shrink-0 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors">
        <X className="w-3.5 h-3.5 text-slate-500" />
      </button>
    </div>
  )
}

// ─── Adjunto en burbuja ───────────────────────────────────────────────────────

function AdjuntoEnBurbuja({ msg, esMio }) {
  const [visorAbierto, setVisorAbierto] = useState(false)
  if (!msg.adjunto_url) return null
  const esImagen = msg.adjunto_tipo === 'imagen'

  return (
    <>
      {esImagen ? (
        <div className="mt-1">
          <img src={msg.adjunto_url} alt={msg.adjunto_nombre ?? 'imagen'}
            onClick={() => setVisorAbierto(true)}
            className="max-w-[220px] max-h-[220px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm" />
          {visorAbierto && <VisorImagen url={msg.adjunto_url} nombre={msg.adjunto_nombre ?? 'imagen'} onClose={() => setVisorAbierto(false)} />}
        </div>
      ) : (
        <a href={msg.adjunto_url} target="_blank" rel="noopener noreferrer"
          className={cn('mt-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
            esMio ? 'bg-white/15 border-white/20 hover:bg-white/25 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
          )}>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', esMio ? 'bg-white/20' : 'bg-red-50')}>
            <FileText className={cn('w-4 h-4', esMio ? 'text-white' : 'text-red-500')} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate max-w-[160px]">{msg.adjunto_nombre ?? 'Documento'}</p>
            <p className={cn('text-[10px]', esMio ? 'text-white/60' : 'text-slate-400')}>PDF · Toca para abrir</p>
          </div>
        </a>
      )}
    </>
  )
}

// ─── Picker de emojis ────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute bottom-full mb-1 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl px-2 py-1.5 flex gap-0.5">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => { onSelect(e); onClose() }}
            className="w-9 h-9 text-xl rounded-xl hover:bg-slate-100 active:scale-110 transition-all flex items-center justify-center">
            {e}
          </button>
        ))}
      </div>
    </>
  )
}

// ─── Burbuja ──────────────────────────────────────────────────────────────────

function Burbuja({ msg, esMio, perfiles, userId, reacciones, onReaccion }) {
  const [showPicker, setShowPicker] = useState(false)
  const perfil      = perfiles[msg.autor_id]
  const rolInfo     = ROL_LABEL[perfil?.rol_principal] ?? { label: 'Usuario', color: 'bg-slate-100 text-slate-600' }
  const tipoConf    = TIPO_CONFIG[msg.tipo] ?? TIPO_CONFIG.texto
  const TipoIcon    = tipoConf.icon
  const reacAgrp    = agruparReacciones(reacciones)
  const tieneReac   = Object.keys(reacAgrp).length > 0
  const vistoIds    = (msg.leido_por ?? []).filter(id => id !== msg.autor_id)
  const vistoPor    = vistoIds.map(id => perfiles[id]?.nombre_completo?.split(' ')[0]).filter(Boolean)
  const soloAdjunto = !msg.contenido && msg.adjunto_url

  return (
    <div className={cn('flex gap-2 mb-1', esMio ? 'flex-row-reverse' : 'flex-row')}>
      {!esMio && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
          <span className="text-xs font-bold text-slate-600">{perfil?.nombre_completo?.charAt(0)?.toUpperCase() ?? '?'}</span>
        </div>
      )}

      <div className={cn('max-w-[75%] flex flex-col', esMio ? 'items-end' : 'items-start')}>
        {!esMio && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-slate-700">{perfil?.nombre_completo ?? 'Usuario'}</span>
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', rolInfo.color)}>{rolInfo.label}</span>
          </div>
        )}

        <div className={cn('flex items-end gap-1', esMio ? 'flex-row-reverse' : 'flex-row')}>
          <div className={cn(
            'rounded-2xl text-sm leading-relaxed shadow-sm',
            soloAdjunto ? 'p-1.5' : 'px-3.5 py-2.5',
            tipoConf.bubble,
            esMio ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
          )}>
            {TipoIcon && (
              <div className={cn('flex items-center gap-1 text-[11px] font-semibold mb-1.5',
                esMio ? 'text-primary-200' : msg.tipo === 'alerta' ? 'text-amber-600' : 'text-emerald-600'
              )}>
                <TipoIcon className="w-3 h-3" />{tipoConf.label}
              </div>
            )}
            {msg.contenido && <p className="whitespace-pre-wrap break-words">{msg.contenido}</p>}
            <AdjuntoEnBurbuja msg={msg} esMio={esMio} />
          </div>

          <div className="relative shrink-0 self-center">
            <button onClick={() => setShowPicker(v => !v)} style={{ opacity: showPicker ? 1 : undefined }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100
                         bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all" title="Reaccionar">＋</button>
            {showPicker && <EmojiPicker onSelect={e => onReaccion(msg.id, e)} onClose={() => setShowPicker(false)} />}
          </div>
        </div>

        {tieneReac && (
          <div className={cn('flex flex-wrap gap-1 mt-1', esMio ? 'justify-end' : 'justify-start')}>
            {Object.entries(reacAgrp).map(([emoji, lista]) => {
              const yoReaccioné = lista.some(r => r.usuario_id === userId)
              const nombres = lista.map(r => perfiles[r.usuario_id]?.nombre_completo?.split(' ')[0] ?? '?').join(', ')
              return (
                <button key={emoji} onClick={() => onReaccion(msg.id, emoji)} title={nombres}
                  className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all hover:scale-105',
                    yoReaccioné ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}>
                  <span>{emoji}</span><span>{lista.length}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className={cn('flex items-center gap-1.5 mt-0.5 px-1', esMio ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-slate-400">{formatHora(msg.created_at)}</span>
          {esMio && vistoPor.length > 0 && (
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <svg className="w-3 h-3 text-primary-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                <path d="M6.854 10.354a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708l3.146 3.147 6.646-6.647a.5.5 0 0 1 .708.708l-7 7z" opacity=".5" transform="translate(2,0)"/>
              </svg>
              {vistoPor.length === 1 ? vistoPor[0] : `${vistoPor[0]} y ${vistoPor.length - 1} más`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ChatPage({ params }) {
  const supabase     = useRef(createClient())
  const router       = useRouter()
  const fileInputRef = useRef(null)

  const [ninoId, setNinoId]                     = useState(null)
  const [userId, setUserId]                     = useState(null)
  const [nino, setNino]                         = useState(null)
  const [mensajes, setMensajes]                 = useState([])
  const [perfiles, setPerfiles]                 = useState({})
  const [reacciones, setReacciones]             = useState({})
  const [texto, setTexto]                       = useState('')
  const [tipo, setTipo]                         = useState('texto')
  const [archivoPendiente, setArchivoPendiente] = useState(null)
  const [subiendoArchivo, setSubiendoArchivo]   = useState(false)
  const [enviando, setEnviando]                 = useState(false)
  const [cargando, setCargando]                 = useState(true)
  const [showTipos, setShowTipos]               = useState(false)
  const [scrollBottom, setScrollBottom]         = useState(true)
  const [errorArchivo, setErrorArchivo]         = useState(null)
  const [hayMasAnteriores, setHayMasAnteriores] = useState(false)
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false)
  // Mostrar botón flotante "Mensajes" cuando el usuario scrollea arriba
  const [showBackBtn, setShowBackBtn]           = useState(false)

  const listRef      = useRef(null)
  const inputRef     = useRef(null)
  const bottomRef    = useRef(null)
  const topAnchorRef = useRef(null) // ancla para mantener posición al cargar anteriores

  // ── Resolver params ───────────────────────────────────────────────────────
  useEffect(() => {
    Promise.resolve(params).then(p => setNinoId(p.id))
  }, [])

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const distFondo = el.scrollHeight - el.scrollTop - el.clientHeight
    setScrollBottom(distFondo < 120)
    // Mostrar botón de regreso cuando el usuario sube bastante (más de 300px del fondo)
    setShowBackBtn(distFondo > 300)
  }

  const cargarPerfil = useCallback((id) => {
    if (!id) return
    setPerfiles(prev => {
      if (prev[id]) return prev
      supabase.current.from('perfiles').select('id, nombre_completo, rol_principal')
        .eq('id', id).maybeSingle()
        .then(({ data }) => { if (data) setPerfiles(p => ({ ...p, [data.id]: data })) })
      return prev
    })
  }, [])

  const marcarLeidos = useCallback(async (msgs, uid) => {
    if (!msgs?.length || !uid) return
    const sb = supabase.current
    const noLeidos = msgs.filter(m => m.autor_id !== uid && !(m.leido_por ?? []).includes(uid))
    for (const m of noLeidos) {
      await sb.rpc('marcar_mensaje_leido', { p_mensaje_id: m.id })
    }
  }, [])

  // ── Carga inicial (últimos PAGE_SIZE mensajes) ────────────────────────────
  useEffect(() => {
    if (!ninoId) return
    async function init() {
      const sb = supabase.current
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const { data: ninoData, error: ninoError } = await sb
        .from('ninos').select('id, nombre, apellido, foto_url, diagnostico')
        .eq('id', ninoId).maybeSingle()
      if (ninoError || !ninoData) { router.push('/dashboard'); return }
      setNino(ninoData)

      // Traer los últimos PAGE_SIZE mensajes
      const { data: msgs } = await sb
        .from('mensajes').select('*').eq('nino_id', ninoId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      const msgsOrdenados = (msgs ?? []).reverse() // más viejos primero

      // Verificar si hay más mensajes anteriores
      if (msgsOrdenados.length === PAGE_SIZE) {
        const { count } = await sb
          .from('mensajes').select('id', { count: 'exact', head: true })
          .eq('nino_id', ninoId)
        setHayMasAnteriores((count ?? 0) > PAGE_SIZE)
      }

      if (msgsOrdenados.length) {
        setMensajes(msgsOrdenados)

        const ids = [...new Set(msgsOrdenados.flatMap(m => [m.autor_id, ...(m.leido_por ?? [])]).filter(Boolean))]
        const { data: pData } = await sb.from('perfiles').select('id, nombre_completo, rol_principal').in('id', ids)
        if (pData) { const map = {}; pData.forEach(p => { map[p.id] = p }); setPerfiles(map) }

        const msgIds = msgsOrdenados.map(m => m.id)
        const { data: rData } = await sb.from('mensaje_reacciones').select('*').in('mensaje_id', msgIds)
        if (rData) {
          const map = {}
          rData.forEach(r => { if (!map[r.mensaje_id]) map[r.mensaje_id] = []; map[r.mensaje_id].push(r) })
          setReacciones(map)
        }
        await marcarLeidos(msgsOrdenados, user.id)
      }
      setCargando(false)
    }
    init()
  }, [ninoId, router, marcarLeidos])

  // Scroll inicial al fondo cuando termina de cargar
  useEffect(() => {
    if (!cargando) setTimeout(() => scrollToBottom(false), 80)
  }, [cargando, scrollToBottom])

  // ── Cargar mensajes anteriores ────────────────────────────────────────────
  const cargarAnteriores = async () => {
    if (cargandoAnteriores || !hayMasAnteriores || !mensajes.length) return
    setCargandoAnteriores(true)

    const sb           = supabase.current
    const masViejoDate = mensajes[0].created_at

    const { data: anteriores } = await sb
      .from('mensajes').select('*').eq('nino_id', ninoId)
      .lt('created_at', masViejoDate)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    const anterioresOrdenados = (anteriores ?? []).reverse()

    if (anterioresOrdenados.length < PAGE_SIZE) setHayMasAnteriores(false)

    if (anterioresOrdenados.length) {
      // Guardar el primer elemento visible para restaurar posición
      const ancla = listRef.current?.querySelector('[data-msg-id]')
      const anclaId = ancla?.dataset?.msgId

      setMensajes(prev => [...anterioresOrdenados, ...prev])

      // Cargar perfiles nuevos
      const ids = [...new Set(anterioresOrdenados.flatMap(m => [m.autor_id, ...(m.leido_por ?? [])]).filter(Boolean))]
        .filter(id => !perfiles[id])
      if (ids.length) {
        const { data: pData } = await sb.from('perfiles').select('id, nombre_completo, rol_principal').in('id', ids)
        if (pData) setPerfiles(prev => {
          const map = { ...prev }; pData.forEach(p => { map[p.id] = p }); return map
        })
      }

      // Cargar reacciones nuevas
      const msgIds = anterioresOrdenados.map(m => m.id)
      const { data: rData } = await sb.from('mensaje_reacciones').select('*').in('mensaje_id', msgIds)
      if (rData) {
        setReacciones(prev => {
          const map = { ...prev }
          rData.forEach(r => { if (!map[r.mensaje_id]) map[r.mensaje_id] = []; map[r.mensaje_id].push(r) })
          return map
        })
      }

      // Restaurar posición de scroll para que no salte al tope
      setTimeout(() => {
        if (anclaId) {
          const el = listRef.current?.querySelector(`[data-msg-id="${anclaId}"]`)
          el?.scrollIntoView({ block: 'start' })
        }
      }, 50)
    }

    setCargandoAnteriores(false)
  }

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !ninoId) return
    const sb = supabase.current
    const channel = sb.channel(`chat-${ninoId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `nino_id=eq.${ninoId}` },
        async (payload) => {
          const nuevo = payload.new
          cargarPerfil(nuevo.autor_id)
          setMensajes(prev => prev.find(m => m.id === nuevo.id) ? prev : [...prev, nuevo])
          if (scrollBottom || nuevo.autor_id === userId) setTimeout(() => scrollToBottom(true), 50)
          if (nuevo.autor_id !== userId) await sb.rpc('marcar_mensaje_leido', { p_mensaje_id: nuevo.id })
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes', filter: `nino_id=eq.${ninoId}` },
        (payload) => {
          const act = payload.new
          setMensajes(prev => prev.map(m => m.id === act.id ? { ...m, leido_por: act.leido_por } : m))
          ;(act.leido_por ?? []).filter(id => !perfiles[id]).forEach(cargarPerfil)
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensaje_reacciones' },
        (payload) => {
          const r = payload.new
          cargarPerfil(r.usuario_id)
          setReacciones(prev => {
            const lista = prev[r.mensaje_id] ?? []
            if (lista.find(x => x.id === r.id)) return prev
            return { ...prev, [r.mensaje_id]: [...lista, r] }
          })
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'mensaje_reacciones' },
        (payload) => {
          const r = payload.old
          setReacciones(prev => ({ ...prev, [r.mensaje_id]: (prev[r.mensaje_id] ?? []).filter(x => x.id !== r.id) }))
        })
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [userId, ninoId, scrollBottom, scrollToBottom, cargarPerfil, perfiles])

  // ── Seleccionar archivo ───────────────────────────────────────────────────
  function onArchivoSeleccionado(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setErrorArchivo(null)
    if (archivo.size > MAX_SIZE_MB * 1024 * 1024) { setErrorArchivo(`El archivo supera los ${MAX_SIZE_MB}MB`); return }
    const esValido = archivo.type.startsWith('image/') || archivo.type === 'application/pdf'
    if (!esValido) { setErrorArchivo('Solo se permiten imágenes (JPG, PNG) y PDFs'); return }
    setArchivoPendiente(archivo)
    e.target.value = ''
  }

  async function subirArchivo(archivo) {
    const sb   = supabase.current
    const ext  = archivo.name.split('.').pop()
    const path = `${ninoId}/${userId}/${Date.now()}.${ext}`
    const { error } = await sb.storage.from('chat-adjuntos').upload(path, archivo, { cacheControl: '3600' })
    if (error) throw error
    const { data } = sb.storage.from('chat-adjuntos').getPublicUrl(path)
    return data.publicUrl
  }

  async function toggleReaccion(mensajeId, emoji) {
    const sb        = supabase.current
    const lista     = reacciones[mensajeId] ?? []
    const existente = lista.find(r => r.usuario_id === userId && r.emoji === emoji)
    if (existente) { await sb.from('mensaje_reacciones').delete().eq('id', existente.id) }
    else           { await sb.from('mensaje_reacciones').insert({ mensaje_id: mensajeId, usuario_id: userId, emoji }) }
  }

  async function enviar(e) {
    e?.preventDefault()
    const contenido = texto.trim()
    if ((!contenido && !archivoPendiente) || enviando) return

    setEnviando(true); setSubiendoArchivo(!!archivoPendiente); setTexto(''); setShowTipos(false)

    let adjunto_url = null, adjunto_tipo = null, adjunto_nombre = null

    if (archivoPendiente) {
      try {
        adjunto_url    = await subirArchivo(archivoPendiente)
        adjunto_tipo   = archivoPendiente.type.startsWith('image/') ? 'imagen' : 'pdf'
        adjunto_nombre = archivoPendiente.name
        setArchivoPendiente(null)
      } catch (err) {
        setErrorArchivo('Error al subir el archivo. Intenta de nuevo.')
        setTexto(contenido); setEnviando(false); setSubiendoArchivo(false); return
      }
    }

    const payload = { nino_id: ninoId, autor_id: userId, tipo }
    if (contenido)      payload.contenido      = contenido
    if (adjunto_url)    payload.adjunto_url    = adjunto_url
    if (adjunto_tipo)   payload.adjunto_tipo   = adjunto_tipo
    if (adjunto_nombre) payload.adjunto_nombre = adjunto_nombre

    const { data: msgInsertado, error } = await supabase.current
    .from('mensajes')
    .insert(payload)
    .select('id')
    .single()
    if (error) { setTexto(contenido) }
    else       { setTipo('texto') }
    // ── Notificación push con delay de 10s ──────────────────
    fetch('/api/notificar-mensaje', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensajeId: msgInsertado?.id,
        ninoId,
        autorId:    userId,
        nombreNino: nino?.nombre,
        nombreAutor: perfiles[userId]?.nombre_completo ?? 'Alguien',
        preview:    payload.adjunto_tipo === 'imagen' ? '📷 Foto'
                  : payload.adjunto_tipo === 'pdf'    ? '📄 Documento'
                  : contenido,
      }),
    }).catch(() => {})

    setEnviando(false); setSubiendoArchivo(false)
    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (cargando) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500">Cargando chat…</p>
      </div>
    </div>
  )

  const items = agruparPorFecha(mensajes)

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/mensajes" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-violet-500
                        flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
          {nino?.foto_url ? <img src={nino.foto_url} alt="" className="w-full h-full object-cover" /> : nino?.nombre?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{nino?.nombre} {nino?.apellido}</p>
          {nino?.diagnostico && <p className="text-xs text-slate-400 truncate">{nino.diagnostico}</p>}
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          En vivo
        </div>
      </header>

      {/* Lista mensajes */}
      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4">

        {/* Botón cargar anteriores */}
        {hayMasAnteriores && (
          <div className="flex justify-center mb-4">
            <button
              onClick={cargarAnteriores}
              disabled={cargandoAnteriores}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white
                         border border-slate-200 rounded-full px-4 py-2 shadow-sm
                         hover:text-primary-600 hover:border-primary-300 hover:shadow-md
                         transition-all disabled:opacity-50"
            >
              {cargandoAnteriores
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…</>
                : <><ChevronUp className="w-3.5 h-3.5" /> Ver mensajes anteriores</>}
            </button>
          </div>
        )}

        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pt-16">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-3">
              <MessageCircle className="w-8 h-8 text-primary-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">Inicien la conversación</p>
            <p className="text-sm text-slate-400 max-w-xs">Este es el espacio del equipo sobre <strong>{nino?.nombre}</strong>.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {items.map(item => {
              if (item.tipo === 'separador') return (
                <div key={item.id} className="flex items-center gap-2 py-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] font-medium text-slate-400 px-2 capitalize">{formatFecha(item.fecha)}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )
              return (
                <div key={item.id} className="group" data-msg-id={item.id}>
                  <Burbuja
                    msg={item}
                    esMio={item.autor_id === userId}
                    perfiles={perfiles}
                    userId={userId}
                    reacciones={reacciones[item.id] ?? []}
                    onReaccion={toggleReaccion}
                  />
                </div>
              )
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Botones flotantes */}
      <div className="fixed bottom-24 right-4 z-10 flex flex-col gap-2 items-end">
        {/* Regreso a Mensajes — aparece cuando subes */}
        {showBackBtn && (
          <Link
            href="/mensajes"
            className="flex items-center gap-2 bg-white shadow-lg border border-slate-200
                       rounded-full pl-3 pr-4 py-2 hover:bg-slate-50 hover:shadow-xl
                       hover:border-primary-300 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-primary-600 transition-colors" />
            <span className="text-xs font-semibold text-slate-600 group-hover:text-primary-700 transition-colors">
              Mensajes
            </span>
          </Link>
        )}

        {/* Ir al fondo */}
        {!scrollBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="bg-white shadow-lg border border-slate-200 rounded-full p-2.5
                       hover:bg-slate-50 transition-all"
          >
            <ChevronDown className="w-4 h-4 text-slate-600" />
          </button>
        )}
      </div>

      {/* Selector tipo */}
      {showTipos && (
        <div className="bg-white border-t border-slate-100 px-4 py-2 flex gap-2">
          {Object.entries(TIPO_CONFIG).map(([key, conf]) => {
            const Icon = conf.icon
            return (
              <button key={key} onClick={() => { setTipo(key); setShowTipos(false) }}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  tipo === key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                )}>
                {Icon && <Icon className="w-3 h-3" />}
                {key === 'texto' ? 'Mensaje' : conf.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Error archivo */}
      {errorArchivo && (
        <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-red-600">{errorArchivo}</p>
          <button onClick={() => setErrorArchivo(null)}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

      {/* Preview archivo pendiente */}
      {archivoPendiente && <AdjuntoPreview archivo={archivoPendiente} onRemove={() => setArchivoPendiente(null)} />}

      {/* Input oculto para archivo */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,application/pdf"
        className="hidden" onChange={onArchivoSeleccionado} />

      {/* Barra de input */}
      <form onSubmit={enviar}
        className="bg-white border-t border-slate-100 px-3 py-3 flex items-end gap-2 shrink-0
                   pb-[env(safe-area-inset-bottom,12px)]">

        <button type="button" onClick={() => setShowTipos(v => !v)}
          className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0',
            tipo !== 'texto' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          )} title="Tipo de mensaje">
          {tipo === 'alerta' ? <AlertTriangle className="w-4 h-4" />
            : tipo === 'nota_clinica' ? <Stethoscope className="w-4 h-4" />
            : <MessageCircle className="w-4 h-4" />}
        </button>

        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={subiendoArchivo}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0
                     bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50" title="Adjuntar foto o PDF">
          {subiendoArchivo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>

        <textarea ref={inputRef} value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={handleKey}
          placeholder={archivoPendiente ? 'Agrega un comentario (opcional)…'
            : tipo === 'alerta' ? '⚠️ Describe la alerta…'
            : tipo === 'nota_clinica' ? '🩺 Agrega tu nota clínica…'
            : `Mensaje sobre ${nino?.nombre ?? 'el niño'}…`}
          rows={1} maxLength={2000}
          className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5
                     text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none
                     focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all
                     max-h-32 overflow-y-auto leading-relaxed"
          style={{ minHeight: '40px' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px' }}
        />

        <Button type="submit" disabled={(!texto.trim() && !archivoPendiente) || enviando}
          size="icon" className="w-9 h-9 rounded-xl shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}