'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Users, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import NextImage from 'next/image'

const ROL_LABELS = {
  terapeuta: 'Terapeuta',
  maestra_sombra: 'Maestra Sombra',
}

const ROL_EMOJIS = {
  terapeuta: '🧠',
  maestra_sombra: '📚',
}

export default function InvitacionPage({ params }) {
  const { token } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === 'true'

  const [estado, setEstado] = useState('cargando') // cargando | ok | error | expirada | cancelada | yaAceptada
  const [inv, setInv] = useState(null)
  const [invitadorNombre, setInvitadorNombre] = useState('')
  const [accionando, setAccionando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    // Verificar sesión
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/auth/login?redirect=/invitacion/${token}`)
      return
    }

    // Obtener invitación (RLS: el invitado puede ver la suya por email)
    const { data, error } = await supabase
      .from('invitaciones')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      setEstado('error')
      setErrorMsg('No encontramos esta invitación. Es posible que el enlace sea incorrecto.')
      return
    }

    if (data.status === 'aceptada') {
      setInv(data)
      setEstado('yaAceptada')
      return
    }
    if (data.status === 'cancelada') {
      setEstado('cancelada')
      return
    }
    if (new Date(data.expires_at) < new Date()) {
      setEstado('expirada')
      return
    }

    setInv(data)

    // Obtener nombre del invitador
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('nombre_completo')
      .eq('id', data.invitado_por)
      .single()
    setInvitadorNombre(perfil?.nombre_completo ?? 'Alguien')

    // Si el usuario acaba de completar su perfil (viene de complete-profile),
    // aceptar automáticamente para no obligarle a hacer clic extra.
    if (isNew) {
      await aceptarInvitacion()
    } else {
      setEstado('ok')
    }
  }

  const aceptarInvitacion = async () => {
    setAccionando(true)
    const res = await fetch('/api/aceptar-invitacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()

    if (res.ok) {
      setEstado('aceptada')
      // Redirigir al dashboard después de 2 s
      setTimeout(() => router.push('/dashboard?bienvenido=true'), 2000)
    } else {
      setErrorMsg(data.error || 'Error al aceptar la invitación')
      setEstado('error')
      setAccionando(false)
    }
  }

  const rechazarInvitacion = async () => {
    setAccionando(true)
    await fetch('/api/aceptar-invitacion', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    router.push('/dashboard')
  }

  // ── Estados de pantalla ──────────────────────────────────────────────────────

  if (estado === 'cargando') {
    return (
      <Pantalla>
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Cargando invitación...</p>
      </Pantalla>
    )
  }

  if (estado === 'error') {
    return (
      <Pantalla>
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invitación no válida</h2>
        <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
        <Link href="/dashboard"><Button>Ir al inicio</Button></Link>
      </Pantalla>
    )
  }

  if (estado === 'expirada') {
    return (
      <Pantalla>
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invitación expirada</h2>
        <p className="text-slate-500 text-sm mb-6">
          Esta invitación ya no es válida. Pide al padre o tutor que te envíe una nueva.
        </p>
        <Link href="/dashboard"><Button variant="outline">Ir al inicio</Button></Link>
      </Pantalla>
    )
  }

  if (estado === 'cancelada') {
    return (
      <Pantalla>
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invitación cancelada</h2>
        <p className="text-slate-500 text-sm mb-6">
          Esta invitación fue cancelada por quien la envió.
        </p>
        <Link href="/dashboard"><Button variant="outline">Ir al inicio</Button></Link>
      </Pantalla>
    )
  }

  if (estado === 'yaAceptada') {
    return (
      <Pantalla>
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Ya eres parte del equipo</h2>
        <p className="text-slate-500 text-sm mb-2">
          Ya aceptaste esta invitación anteriormente.
        </p>
        {inv?.nombre_nino && (
          <p className="text-sm font-medium text-primary-600 mb-6">
            {ROL_EMOJIS[inv.rol] ?? '👤'} {ROL_LABELS[inv.rol] ?? inv.rol} de {inv.nombre_nino}
          </p>
        )}
        <Link href="/dashboard"><Button>Ir al dashboard</Button></Link>
      </Pantalla>
    )
  }

  if (estado === 'aceptada') {
    return (
      <Pantalla>
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {isNew ? '¡Bienvenido a Pulso Azul!' : '¡Invitación aceptada!'}
        </h2>
        <p className="text-slate-500 text-sm mb-2">
          {isNew
            ? 'Tu cuenta está lista. Ya eres parte del equipo de:'
            : 'Ahora formas parte del equipo de:'}
        </p>
        {inv?.nombre_nino && (
          <p className="text-base font-bold text-slate-800 mb-1">
            {ROL_EMOJIS[inv.rol] ?? '👤'} {inv.nombre_nino}
          </p>
        )}
        <p className="text-sm text-slate-500 mb-6">
          como {ROL_LABELS[inv.rol] ?? inv.rol}
        </p>
        <p className="text-xs text-slate-400">Redirigiendo al dashboard...</p>
      </Pantalla>
    )
  }

  // ── Estado 'ok': mostrar la invitación y botones de aceptar / rechazar ────────
  const rolEmoji = ROL_EMOJIS[inv.rol] ?? '👤'
  const rolLabel = ROL_LABELS[inv.rol] ?? inv.rol

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={120} height={40} className="object-contain" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-sky-500 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-primary-100 text-xs font-medium">Tienes una invitación</p>
                <h1 className="text-lg font-bold">Únete al equipo</h1>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Invitador */}
            <p className="text-slate-500 text-sm mb-1">
              <span className="font-semibold text-slate-900">{invitadorNombre}</span> te invita a:
            </p>

            {/* Niño + rol */}
            <div className="mt-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Niño</p>
              <p className="text-lg font-bold text-slate-900">{inv.nombre_nino ?? '—'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl">{rolEmoji}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rolLabel}</p>
                  <p className="text-xs text-slate-400">
                    {inv.permisos === 'edicion' ? 'Puede ver y crear registros' : 'Solo lectura'}
                  </p>
                </div>
              </div>
            </div>

            {/* Expiración */}
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Válida hasta {new Date(inv.expires_at).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={rechazarInvitacion}
                disabled={accionando}
              >
                Rechazar
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={aceptarInvitacion}
                disabled={accionando}
              >
                {accionando
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Aceptar
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Wrapper centrado para estados simples ──────────────────────────────────────
function Pantalla({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-sm w-full text-center">
        {children}
      </div>
    </div>
  )
}
