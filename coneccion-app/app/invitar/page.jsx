'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Mail, Check, Clock, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react'
import Link from 'next/link'
import { validarEmail } from '@/lib/utils'

const ROL_LABELS = {
  terapeuta: 'Terapeuta',
  maestra_sombra: 'Maestra Sombra',
}

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',  Icon: Clock },
  aceptada:   { label: 'Aceptada',   color: 'bg-green-100 text-green-700',  Icon: CheckCircle },
  cancelada:  { label: 'Cancelada',  color: 'bg-slate-100 text-slate-500',  Icon: XCircle },
  expirada:   { label: 'Expirada',   color: 'bg-red-100 text-red-600',      Icon: XCircle },
}

export default function InvitarPage() {
  const [loading, setLoading]         = useState(false)
  const [loadingNinos, setLoadingNinos] = useState(true)
  const [loadingInvs, setLoadingInvs] = useState(true)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [ninos, setNinos]             = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [formData, setFormData] = useState({
    email: '',
    ninoId: '',
    rol: 'maestra_sombra',
    permisos: 'edicion',
  })

  useEffect(() => {
    fetchNinos()
    fetchInvitaciones()
  }, [])

  const fetchNinos = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('ninos')
      .select('*')
      .eq('padre_id', user.id)

    setNinos(data || [])
    if (data?.length === 1) {
      setFormData(prev => ({ ...prev, ninoId: data[0].id }))
    }
    setLoadingNinos(false)
  }

  const fetchInvitaciones = useCallback(async () => {
    setLoadingInvs(true)
    try {
      const res = await fetch('/api/invitar')
      const data = await res.json()
      setInvitaciones(data.invitaciones ?? [])
    } catch {
      setInvitaciones([])
    } finally {
      setLoadingInvs(false)
    }
  }, [])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validarEmail(formData.email)) {
      setError('Por favor ingresa un email válido')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/invitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          ninoId: formData.ninoId,
          rol: formData.rol,
          permisos: formData.permisos,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar invitación')

      setSuccess(data.message)
      setFormData(prev => ({ ...prev, email: '' }))
      fetchInvitaciones()

    } catch (err) {
      setError(err.message || 'Error al enviar la invitación')
    } finally {
      setLoading(false)
    }
  }

  const cancelarInvitacion = async (id) => {
    const res = await fetch('/api/invitar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitacionId: id }),
    })
    if (res.ok) {
      setInvitaciones(prev =>
        prev.map(inv => inv.id === id ? { ...inv, status: 'cancelada' } : inv)
      )
    }
  }

  if (loadingNinos) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Cargando...</p>
      </div>
    )
  }

  if (ninos.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                No hay niños registrados
              </h2>
              <p className="text-slate-600 mb-6">
                Primero necesitas agregar el perfil de un niño para poder invitar a su equipo terapéutico
              </p>
              <Link href="/nino/nuevo">
                <Button>Agregar niño</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        {/* ── Formulario de invitación ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Invitar al equipo terapéutico</CardTitle>
            <CardDescription>
              Agrega maestras sombra y terapeutas para que puedan ver y registrar el progreso del niño
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                name="ninoId"
                label="¿Para qué niño?"
                value={formData.ninoId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar...</option>
                {ninos.map(nino => (
                  <option key={nino.id} value={nino.id}>
                    {nino.nombre} {nino.apellido}
                  </option>
                ))}
              </Select>

              <Input
                type="email"
                name="email"
                label="Email de la persona a invitar"
                placeholder="maestra@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                helperText="Recibirán un correo o notificación con el enlace para aceptar"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Select name="rol" label="Rol" value={formData.rol} onChange={handleChange} required>
                  <option value="maestra_sombra">Maestra Sombra</option>
                  <option value="terapeuta">Terapeuta</option>
                </Select>

                <Select name="permisos" label="Permisos" value={formData.permisos} onChange={handleChange} required>
                  <option value="lectura">Solo lectura</option>
                  <option value="edicion">Lectura y edición</option>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-900 mb-1">Sobre los permisos:</p>
                <ul className="text-blue-700 space-y-1 list-disc list-inside">
                  <li><strong>Solo lectura:</strong> Puede ver registros y progreso</li>
                  <li><strong>Lectura y edición:</strong> Puede ver y crear nuevos registros</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{success}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Link href="/dashboard">
                  <Button variant="ghost" type="button">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Mail className="w-4 h-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar invitación'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Historial de invitaciones ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invitaciones enviadas</CardTitle>
                <CardDescription>Estado de todas las invitaciones que has enviado</CardDescription>
              </div>
              <button
                onClick={fetchInvitaciones}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                title="Actualizar"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInvs ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingInvs ? (
              <p className="text-sm text-slate-400 text-center py-4">Cargando...</p>
            ) : invitaciones.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Aún no has enviado ninguna invitación.
              </p>
            ) : (
              <div className="space-y-3">
                {invitaciones.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pendiente
                  const StatusIcon = cfg.Icon
                  return (
                    <div
                      key={inv.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {inv.email_invitado}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ROL_LABELS[inv.rol] ?? inv.rol}
                          {inv.nombre_nino ? ` · ${inv.nombre_nino}` : ''}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Enviada {new Date(inv.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          {inv.aceptada_at
                            ? ` · Aceptada ${new Date(inv.aceptada_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                            : inv.status === 'pendiente'
                            ? ` · Expira ${new Date(inv.expires_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                            : ''}
                        </p>
                      </div>
                      {inv.status === 'pendiente' && (
                        <button
                          onClick={() => cancelarInvitacion(inv.id)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Cancelar invitación"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
