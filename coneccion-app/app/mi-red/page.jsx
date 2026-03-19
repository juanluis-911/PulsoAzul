'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Share2, Copy, Check, CheckCircle2, Clock,
  XCircle, UserCheck, Plus, Gift, Star, ArrowLeft, RefreshCw, X,
} from 'lucide-react'
import Link from 'next/link'
import { validarEmail } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700',   Icon: Clock },
  registrado: { label: 'Registrado',  color: 'bg-blue-100 text-blue-700',     Icon: UserCheck },
  suscrito:   { label: 'Suscrito',    color: 'bg-green-100 text-green-700',   Icon: CheckCircle2 },
  cancelado:  { label: 'Cancelado',   color: 'bg-slate-100 text-slate-500',   Icon: XCircle },
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className={`flex-1 min-w-0 rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
      </div>
    </div>
  )
}

export default function MiRedPage() {
  const [loading, setLoading]       = useState(true)
  const [referidos, setReferidos]   = useState([])
  const [stats, setStats]           = useState({ total: 0, registrados: 0, suscritos: 0, pendientes: 0, bonos: 0 })
  const [userId, setUserId]         = useState(null)
  const [copied, setCopied]         = useState(false)
  const [emailInvite, setEmailInvite] = useState('')
  const [enviando, setEnviando]     = useState(false)
  const [invMsg, setInvMsg]         = useState({ type: '', text: '' })

  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || ''

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    await fetchReferidos()
  }

  const fetchReferidos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/referidos')
      const data = await res.json()
      setReferidos(data.referidos ?? [])
      setStats(data.stats ?? { total: 0, registrados: 0, suscritos: 0, pendientes: 0, bonos: 0 })
    } catch {
      setReferidos([])
    } finally {
      setLoading(false)
    }
  }, [])

  const linkPersonal = userId ? `${appUrl}/auth/registro?ref=${userId}` : ''

  const copyLink = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const enviarInvitacion = async (e) => {
    e.preventDefault()
    if (!validarEmail(emailInvite)) {
      setInvMsg({ type: 'error', text: 'Email inválido' })
      return
    }
    setEnviando(true)
    setInvMsg({ type: '', text: '' })

    const res = await fetch('/api/referidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInvite }),
    })
    const data = await res.json()

    if (res.ok) {
      setInvMsg({ type: 'success', text: '¡Invitación creada! Comparte el link a continuación.' })
      setEmailInvite('')
      fetchReferidos()
    } else {
      setInvMsg({ type: 'error', text: data.error || 'Error al crear invitación' })
    }
    setEnviando(false)
  }

  const cancelarInvitacion = async (id) => {
    const res = await fetch('/api/referidos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referidoId: id }),
    })
    if (res.ok) {
      setReferidos(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelado' } : r))
    }
  }

  const emailReferidos  = referidos.filter(r => r.tipo === 'email')
  const linkReferidos   = referidos.filter(r => r.tipo === 'link')

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Mi Red</h1>
          <p className="text-slate-500 text-sm mt-1">
            Invita a otros padres y terapeutas a usar Pulso Azul y gana bonificaciones.
          </p>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-3 flex-wrap">
          <StatCard
            icon={Users}
            value={stats.total}
            label="Total invitados"
            color="bg-blue-50 text-blue-700 border-blue-200"
          />
          <StatCard
            icon={UserCheck}
            value={stats.registrados}
            label="Ya registrados"
            color="bg-green-50 text-green-700 border-green-200"
          />
          <StatCard
            icon={Clock}
            value={stats.pendientes}
            label="Pendientes"
            color="bg-amber-50 text-amber-700 border-amber-200"
          />
        </div>

        {/* ── Bono ganados ──────────────────────────────────────────────────── */}
        {stats.bonos > 0 && (
          <div className="bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">
                🎉 ¡Tienes {stats.bonos} {stats.bonos === 1 ? 'bonificación ganada' : 'bonificaciones ganadas'}!
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Se aplican a tu próxima renovación de suscripción.
              </p>
            </div>
          </div>
        )}

        {/* ── Link personal ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-slate-600" />
            <h2 className="font-bold text-slate-900">Tu link personal de referido</h2>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Este link es tuyo para siempre. Compártelo en redes, WhatsApp o donde quieras.
            Cualquier persona que se registre con él quedará vinculada a tu cuenta.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-500 font-mono truncate">
                {linkPersonal || 'Cargando...'}
              </p>
            </div>
            <button
              onClick={() => copyLink(linkPersonal)}
              disabled={!linkPersonal}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          {/* Via link referrals */}
          {linkReferidos.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Registrados por tu link ({linkReferidos.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {linkReferidos.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1">
                    <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {r.nombre_invitado?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-xs text-slate-600 font-medium">
                      {r.nombre_invitado ?? 'Anónimo'}
                    </span>
                    {r.status === 'suscrito' && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Invitaciones personalizadas ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900">Invitaciones personalizadas</h2>
              {emailReferidos.length > 0 && (
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {emailReferidos.length}
                </span>
              )}
            </div>
            <button
              onClick={fetchReferidos}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Form para nueva invitación */}
          <form onSubmit={enviarInvitacion} className="px-5 py-4 bg-slate-50 border-b border-slate-100">
            <p className="text-xs text-slate-500 mb-2 font-medium">Enviar invitación personalizada</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@ejemplo.com"
                value={emailInvite}
                onChange={e => setEmailInvite(e.target.value)}
                className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                required
              />
              <button
                type="submit"
                disabled={enviando}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white
                           text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {enviando ? 'Creando...' : 'Invitar'}
              </button>
            </div>
            {invMsg.text && (
              <p className={`text-xs mt-2 ${invMsg.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                {invMsg.text}
              </p>
            )}
          </form>

          {/* Lista */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>
            ) : emailReferidos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">Aún no has enviado invitaciones personalizadas.</p>
                <p className="text-xs text-slate-400 mt-1">Escribe un email arriba para crear una.</p>
              </div>
            ) : (
              emailReferidos.map(r => {
                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pendiente
                const StatusIcon = cfg.Icon
                const refLink = `${appUrl}/auth/registro?ref=${r.token}`
                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar inicial */}
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                        {(r.nombre_invitado || r.email_invitado)?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          {r.nombre_invitado && (
                            <p className="font-semibold text-slate-900 text-sm">{r.nombre_invitado}</p>
                          )}
                          {r.status === 'suscrito' && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                              <Gift className="w-3 h-3" /> Bono {r.bono_otorgado ? 'ganado' : 'pendiente'}
                            </span>
                          )}
                          {r.status !== 'cancelado' && (
                            <span className="text-xs text-green-700 font-medium">
                              {r.status === 'registrado' || r.status === 'suscrito' ? '· Unido' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          ✉️ {r.email_invitado}
                        </p>
                        {/* Link de registro de la invitación personalizada */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[11px] text-slate-400 font-mono truncate flex-1 min-w-0">
                            {refLink}
                          </p>
                          <button
                            onClick={() => copyLink(refLink)}
                            className="shrink-0 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copiar link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {r.status === 'pendiente' && (
                        <button
                          onClick={() => cancelarInvitacion(r.id)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                          title="Cancelar invitación"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Info bonos ────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-amber-900 text-sm">¿Cómo funciona la bonificación?</h3>
          </div>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>Invita a un padre o terapeuta con tu link personal o una invitación personalizada.</li>
            <li>Cuando esa persona <strong>se suscribe a Pulso Azul</strong>, recibes automáticamente una bonificación.</li>
            <li>Las bonificaciones se aplican como descuento en tu próxima renovación.</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
