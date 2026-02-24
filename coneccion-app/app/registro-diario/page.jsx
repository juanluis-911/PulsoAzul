'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePadreSubscription } from '@/hooks/usePadreSubscription'

// ─── Constantes clínicas ──────────────────────────────────────────────────────

const NIVEL_APOYO = [
  { valor: 0, label: 'Independiente',         desc: 'Lo hizo sin ningún apoyo', color: 'bg-green-100 border-green-400 text-green-800' },
  { valor: 1, label: 'Indicación verbal',     desc: 'Solo necesitó que se le dijera', color: 'bg-lime-100 border-lime-400 text-lime-800' },
  { valor: 2, label: 'Modelado',              desc: 'Necesitó ver el ejemplo', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { valor: 3, label: 'Apoyo físico parcial',  desc: 'Necesitó guía con mano/cuerpo', color: 'bg-orange-100 border-orange-400 text-orange-800' },
  { valor: 4, label: 'Apoyo físico total',    desc: 'Necesitó asistencia completa', color: 'bg-red-100 border-red-400 text-red-800' },
]

const FRECUENCIA = [
  { valor: 0, label: 'Nunca',         emoji: '⭕' },
  { valor: 1, label: 'Pocas veces',   emoji: '🔸' },
  { valor: 2, label: 'Varias veces',  emoji: '🔶' },
  { valor: 3, label: 'Frecuente',     emoji: '🔴' },
]

const NIVEL_1_5 = [1, 2, 3, 4, 5]

const CONTEXTO_FLAGS = [
  { key: 'durmio_bien',        label: '😴 Durmió bien' },
  { key: 'comio_bien',         label: '🍽️ Comió bien' },
  { key: 'tomo_medicamento',   label: '💊 Tomó medicamento' },
  { key: 'cambio_rutina',      label: '🔄 Cambio de rutina' },
  { key: 'evento_estresante',  label: '⚡ Evento estresante' },
  { key: 'buen_descanso_fin',  label: '🏖️ Descansó el fin de semana' },
]

const ACTIVIDADES_TIPO = [
  { key: 'lectura',       label: '📚 Lectura' },
  { key: 'matematicas',   label: '🔢 Matemáticas' },
  { key: 'escritura',     label: '✏️ Escritura' },
  { key: 'juego_libre',   label: '🎮 Juego libre' },
  { key: 'juego_dirigido',label: '🎯 Juego dirigido' },
  { key: 'arte',          label: '🎨 Arte / manualidades' },
  { key: 'musica',        label: '🎵 Música' },
  { key: 'motricidad',    label: '🏃 Motricidad / deporte' },
  { key: 'vida_diaria',   label: '🏠 Vida diaria (higiene, comida)' },
  { key: 'terapia',       label: '🧩 Sesión terapéutica' },
]

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function SeccionTitulo({ numero, titulo, descripcion }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {numero}
      </span>
      <div>
        <h3 className="font-semibold text-slate-900">{titulo}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
      </div>
    </div>
  )
}

function EscalaRegulacion({ valor, onChange }) {
  const niveles = [
    { v: 1, emoji: '🌪️', label: 'Crisis',           desc: 'No regulado, sin acceso a aprendizaje' },
    { v: 2, emoji: '😤', label: 'Muy alterado',     desc: 'Alta tensión, necesita apoyo constante' },
    { v: 3, emoji: '😐', label: 'Funcional c/ apoyo',desc: 'Puede participar con andamiaje' },
    { v: 4, emoji: '🙂', label: 'Bien regulado',    desc: 'Funciona bien con supervisión normal' },
    { v: 5, emoji: '😄', label: 'Óptimo',           desc: 'Autorregulado, disponible para aprender' },
  ]
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {niveles.map(n => (
        <button
          key={n.v}
          type="button"
          onClick={() => onChange(n.v)}
          className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all text-center ${
            valor === n.v
              ? 'border-primary-500 bg-primary-50 shadow-sm scale-105'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-2xl">{n.emoji}</span>
          <span className="text-xs font-semibold text-slate-700 mt-1 leading-tight">{n.label}</span>
          <span className={`text-xs font-bold mt-1 ${valor === n.v ? 'text-primary-600' : 'text-slate-400'}`}>
            {n.v}/5
          </span>
        </button>
      ))}
    </div>
  )
}

function SelectorNivelApoyo({ valor, onChange }) {
  return (
    <div className="space-y-2">
      {NIVEL_APOYO.map(n => (
        <button
          key={n.valor}
          type="button"
          onClick={() => onChange(n.valor)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
            valor === n.valor
              ? n.color + ' border-2 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 ${
            valor === n.valor ? 'bg-white border-current' : 'bg-slate-100 border-slate-300 text-slate-500'
          }`}>
            {n.valor}
          </span>
          <div>
            <span className="text-sm font-semibold">{n.label}</span>
            <span className="text-xs text-slate-500 block">{n.desc}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

function SelectorFrecuencia({ valor, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {FRECUENCIA.map(f => (
        <button
          key={f.valor}
          type="button"
          onClick={() => onChange(f.valor)}
          className={`flex flex-col items-center p-2.5 rounded-lg border-2 transition-all ${
            valor === f.valor
              ? 'border-primary-500 bg-primary-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-xl">{f.emoji}</span>
          <span className="text-xs font-medium text-slate-700 mt-1 text-center leading-tight">{f.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RegistroDiarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingNinos, setLoadingNinos] = useState(true)
  const [error, setError] = useState('')
  const [ninos, setNinos] = useState([])

  // Estado del formulario
  const hoy = new Date()
  const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  const [base, setBase] = useState({
    ninoId: '',
    fecha: fechaLocal,  // 👈 usa fecha local, no UTC
    tipoRegistro: 'escuela',
  })

  // ── Verificación de suscripción del padre ──
  const { padreHaPagado, loading: loadingPago } = usePadreSubscription(base.ninoId)

  // 1. Regulación emocional
  const [regulacionInicio, setRegulacionInicio] = useState(null)
  const [regulacionFin, setRegulacionFin]       = useState(null)

  // 2. Contexto del día (checkboxes binarios)
  const [contexto, setContexto] = useState(
    Object.fromEntries(CONTEXTO_FLAGS.map(f => [f.key, false]))
  )

  // 3. Actividades y participación (cuáles + nivel 1-3)
  const [actividades, setActividades] = useState(
    Object.fromEntries(ACTIVIDADES_TIPO.map(a => [a.key, { activa: false, participacion: null }]))
  )

  // 4. Nivel de apoyo general del día
  const [nivelApoyo, setNivelApoyo] = useState(null)

  // 5. Conducta / regulación emocional
  const [conductaPatron, setConductaPatron] = useState(null)
  const [conductaDuracion, setConductaDuracion] = useState('')

  // 6. Comunicación y lenguaje
  const [comunicacionIniciativa, setComunicacionIniciativa] = useState(null)
  const [comunicacionClara, setComunicacionClara] = useState(null)

  // 7. Habilidades sociales
  const [socialInteraccion, setSocialInteraccion] = useState(null)
  const [socialTurnos, setSocialTurnos] = useState(null)

  // 8. Autonomía
  const [autonomiaHigiene, setAutonomiaHigiene] = useState(null)
  const [autonomiaAlimentacion, setAutonomiaAlimentacion] = useState(null)

  // 9. Habilidades académicas/cognitivas
  const [academicoAtencion, setAcademicoAtencion] = useState(null)
  const [academicoPersistencia, setAcademicoPersistencia] = useState(null)

  // 10. Habilidades motoras
  const [motoraFina, setMotoraFina] = useState(null)
  const [motoraGruesa, setMotoraGruesa] = useState(null)

  // Notas libres
  const [notasLibres, setNotasLibres] = useState('')

  useEffect(() => { fetchNinos() }, [])

  const fetchNinos = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: ninosPadre }, { data: equipoData }] = await Promise.all([
      supabase.from('ninos').select('*').eq('padre_id', user.id),
      supabase.from('equipo_terapeutico').select('ninos(*)').eq('usuario_id', user.id).eq('permisos', 'edicion'),
    ])

    const ninosEquipo = equipoData?.map(e => e.ninos) || []
    const todos = [...(ninosPadre || []), ...ninosEquipo]
    const unicos = todos.filter((n, i, s) => i === s.findIndex(x => x.id === n.id))
    setNinos(unicos)
    if (unicos.length === 1) setBase(p => ({ ...p, ninoId: unicos[0].id }))
    setLoadingNinos(false)
  }

  const toggleContexto = (key) =>
    setContexto(p => ({ ...p, [key]: !p[key] }))

  const toggleActividad = (key) =>
    setActividades(p => ({
      ...p,
      [key]: { ...p[key], activa: !p[key].activa, participacion: !p[key].activa ? null : p[key].participacion },
    }))

  const setParticipacion = (key, val) =>
    setActividades(p => ({ ...p, [key]: { ...p[key], participacion: val } }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!base.ninoId) { setError('Selecciona un niño'); return }

    // ── Bloquear si el padre no ha pagado ──
    if (padreHaPagado === false) {
      setError('El padre de este niño no tiene una suscripción activa. No es posible agregar registros por el momento.')
      return
    }

    if (!regulacionInicio || !regulacionFin) { setError('Registra el nivel de regulación al inicio y al fin del día'); return }
    if (nivelApoyo === null) { setError('Selecciona el nivel de apoyo general'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No se pudo verificar tu sesión'); setLoading(false); return }

    const actividadesActivas = Object.entries(actividades)
      .filter(([, v]) => v.activa)
      .map(([key, v]) => ({ tipo: key, participacion: v.participacion }))

    const payload = {
      nino_id: base.ninoId,
      fecha: base.fecha,
      tipo_registro: base.tipoRegistro,
      creado_por: user.id,
      estado_animo: ['muy_dificil','dificil','regular','bien','muy_bien'][regulacionInicio - 1],
      metricas: {
        regulacion: { inicio: regulacionInicio, fin: regulacionFin },
        contexto,
        actividades: actividadesActivas,
        nivel_apoyo_general: nivelApoyo,
        conducta: { frecuencia_disruptiva: conductaPatron, duracion_minutos: conductaDuracion ? Number(conductaDuracion) : null },
        comunicacion: { iniciativa: comunicacionIniciativa, claridad: comunicacionClara },
        social: { interaccion: socialInteraccion, turnos: socialTurnos },
        autonomia: { higiene: autonomiaHigiene, alimentacion: autonomiaAlimentacion },
        academico: { atencion: academicoAtencion, persistencia: academicoPersistencia },
        motora: { fina: motoraFina, gruesa: motoraGruesa },
      },
      notas: notasLibres || null,
      actividades: actividadesActivas.map(a => a.tipo),
    }

    const { error: insertError } = await supabase.from('registros_diarios').insert([payload])

    if (insertError) { setError(insertError.message); setLoading(false); return }

    const nino = ninos.find(n => n.id === base.ninoId)
    if (nino) {
      fetch('/api/notificar-registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ninoId: nino.id, nombreNino: nino.nombre, creadoPor: user.id, urlRegistro: `/progreso?nino=${nino.id}` }),
      }).catch(() => {})
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (loadingNinos) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-600">Cargando...</p>
    </div>
  )

  if (ninos.length === 0) return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card><CardContent className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No hay niños registrados</h2>
          <Link href="/nino/nuevo"><Button>Agregar niño</Button></Link>
        </CardContent></Card>
      </div>
    </div>
  )

  // ── Bandera de acceso bloqueado (solo cuando ya hay niño seleccionado y confirmamos que no pagó) ──
  const bloqueado = base.ninoId && padreHaPagado === false

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al dashboard
        </Link>

        {/* ── Aviso de suscripción inactiva ── */}
        {bloqueado && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-4 mb-5 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Suscripción inactiva</p>
              <p className="text-sm mt-0.5">
                El padre de este niño no tiene una suscripción activa. No podrás guardar registros hasta que realice su pago.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Encabezado ── */}
          <Card>
            <CardHeader>
              <CardTitle>Registro diario clínico</CardTitle>
              <CardDescription>Todas las métricas son cuantificables para generar reportes de progreso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select name="ninoId" label="Niño *" value={base.ninoId}
                  onChange={e => setBase(p => ({ ...p, ninoId: e.target.value }))} required>
                  <option value="">Seleccionar...</option>
                  {ninos.map(n => <option key={n.id} value={n.id}>{n.nombre} {n.apellido}</option>)}
                </Select>
                <Input type="date" label="Fecha *" value={base.fecha}
                  onChange={e => setBase(p => ({ ...p, fecha: e.target.value }))} required />
              </div>
              <Select name="tipoRegistro" label="Contexto del registro *" value={base.tipoRegistro}
                onChange={e => setBase(p => ({ ...p, tipoRegistro: e.target.value }))} required>
                <option value="escuela">🏫 Escuela</option>
                <option value="casa">🏠 Casa</option>
                <option value="terapia">🧩 Terapia</option>
              </Select>
            </CardContent>
          </Card>

          {/* ── 1. Contexto del día ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="1" titulo="Contexto del día"
                descripcion="Variables que influyen en la conducta. Marca todo lo que aplique." />
              <div className="grid grid-cols-2 gap-2">
                {CONTEXTO_FLAGS.map(f => (
                  <button key={f.key} type="button" onClick={() => toggleContexto(f.key)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm text-left transition-all ${
                      contexto[f.key]
                        ? 'border-primary-500 bg-primary-50 text-primary-800 font-medium'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      contexto[f.key] ? 'bg-primary-500 border-primary-500' : 'border-slate-300'
                    }`}>
                      {contexto[f.key] && <span className="text-white text-xs">✓</span>}
                    </span>
                    {f.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Regulación emocional ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="2" titulo="Regulación emocional"
                descripcion="Escala 1–5 con descriptores conductuales. Registra inicio y fin del día." />
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Al inicio del día *</p>
                  <EscalaRegulacion valor={regulacionInicio} onChange={setRegulacionInicio} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Al final del día *</p>
                  <EscalaRegulacion valor={regulacionFin} onChange={setRegulacionFin} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 3. Conducta ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="3" titulo="Conducta"
                descripcion="Frecuencia de conductas disruptivas o de alta intensidad." />
              <p className="text-sm font-medium text-slate-700 mb-2">¿Con qué frecuencia ocurrieron conductas disruptivas?</p>
              <SelectorFrecuencia valor={conductaPatron} onChange={setConductaPatron} />
              {conductaPatron !== null && conductaPatron > 0 && (
                <div className="mt-3">
                  <Input type="number" label="Duración total estimada (minutos)" min="0" max="480"
                    placeholder="Ej: 15"
                    value={conductaDuracion}
                    onChange={e => setConductaDuracion(e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 4. Nivel de apoyo general ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="4" titulo="Nivel de apoyo general del día *"
                descripcion="¿Cuánto apoyo necesitó para participar en las actividades del día?" />
              <SelectorNivelApoyo valor={nivelApoyo} onChange={setNivelApoyo} />
            </CardContent>
          </Card>

          {/* ── 5. Comunicación ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="5" titulo="Comunicación y lenguaje"
                descripcion="1 = mínima / 5 = excelente" />
              <div className="space-y-4">
                {[
                  { label: 'Iniciativa comunicativa', desc: '¿Inició comunicación espontáneamente?', val: comunicacionIniciativa, set: setComunicacionIniciativa },
                  { label: 'Claridad del mensaje', desc: '¿Se entendió lo que comunicó?', val: comunicacionClara, set: setComunicacionClara },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500 mb-2">{item.desc}</p>
                    <div className="flex gap-2">
                      {NIVEL_1_5.map(n => (
                        <button key={n} type="button" onClick={() => item.set(n)}
                          className={`flex-1 h-10 rounded-lg border-2 font-bold text-sm transition-all ${
                            item.val === n
                              ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── 6. Habilidades sociales ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="6" titulo="Habilidades sociales"
                descripcion="1 = mínima / 5 = excelente" />
              <div className="space-y-4">
                {[
                  { label: 'Interacción con pares', desc: '¿Buscó o respondió a otros niños?', val: socialInteraccion, set: setSocialInteraccion },
                  { label: 'Espera de turnos', desc: '¿Esperó su turno en actividades?', val: socialTurnos, set: setSocialTurnos },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500 mb-2">{item.desc}</p>
                    <div className="flex gap-2">
                      {NIVEL_1_5.map(n => (
                        <button key={n} type="button" onClick={() => item.set(n)}
                          className={`flex-1 h-10 rounded-lg border-2 font-bold text-sm transition-all ${
                            item.val === n
                              ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── 7. Autonomía ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="7" titulo="Autonomía / vida diaria"
                descripcion="Nivel de apoyo requerido en rutinas de vida diaria." />
              {[
                { label: 'Higiene personal', desc: '(lavado de manos, baño, dientes)', val: autonomiaHigiene, set: setAutonomiaHigiene },
                { label: 'Alimentación', desc: '(comer, usar cubiertos, gestionar tiempos)', val: autonomiaAlimentacion, set: setAutonomiaAlimentacion },
              ].map(item => (
                <div key={item.label} className="mb-5 last:mb-0">
                  <p className="text-sm font-medium text-slate-700">{item.label} <span className="text-slate-400 font-normal">{item.desc}</span></p>
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {NIVEL_APOYO.map(n => (
                      <button key={n.valor} type="button" onClick={() => item.set(n.valor)}
                        className={`py-2 px-1 rounded-lg border-2 text-center text-xs font-medium transition-all ${
                          item.val === n.valor
                            ? n.color + ' shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}>
                        <span className="font-bold block">{n.valor}</span>
                        <span className="leading-tight block mt-0.5">{n.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-1">0=Independiente · 4=Apoyo total</p>
            </CardContent>
          </Card>

          {/* ── 8. Habilidades académicas ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="8" titulo="Habilidades académicas / cognitivas"
                descripcion="1 = mínima / 5 = excelente" />
              <div className="space-y-4">
                {[
                  { label: 'Atención sostenida', desc: '¿Se mantuvo en la tarea?', val: academicoAtencion, set: setAcademicoAtencion },
                  { label: 'Persistencia ante la dificultad', desc: '¿Intentó antes de rendirse o pedir ayuda?', val: academicoPersistencia, set: setAcademicoPersistencia },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500 mb-2">{item.desc}</p>
                    <div className="flex gap-2">
                      {NIVEL_1_5.map(n => (
                        <button key={n} type="button" onClick={() => item.set(n)}
                          className={`flex-1 h-10 rounded-lg border-2 font-bold text-sm transition-all ${
                            item.val === n
                              ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── 9. Habilidades motoras ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="9" titulo="Habilidades motoras"
                descripcion="1 = mínima / 5 = excelente" />
              <div className="space-y-4">
                {[
                  { label: 'Motricidad fina', desc: '(escritura, recorte, manipulación de objetos pequeños)', val: motoraFina, set: setMotoraFina },
                  { label: 'Motricidad gruesa', desc: '(coordinación, equilibrio, desplazamiento)', val: motoraGruesa, set: setMotoraGruesa },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500 mb-2">{item.desc}</p>
                    <div className="flex gap-2">
                      {NIVEL_1_5.map(n => (
                        <button key={n} type="button" onClick={() => item.set(n)}
                          className={`flex-1 h-10 rounded-lg border-2 font-bold text-sm transition-all ${
                            item.val === n
                              ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── 10. Actividades del día ── */}
          <Card>
            <CardContent className="pt-5">
              <SeccionTitulo numero="10" titulo="Actividades realizadas"
                descripcion="Selecciona las actividades del día y el nivel de participación en cada una." />
              <div className="space-y-3">
                {ACTIVIDADES_TIPO.map(a => (
                  <div key={a.key} className={`rounded-xl border-2 transition-all overflow-hidden ${
                    actividades[a.key].activa ? 'border-primary-300 bg-primary-50' : 'border-slate-200 bg-white'
                  }`}>
                    <button type="button" onClick={() => toggleActividad(a.key)}
                      className="w-full flex items-center gap-3 p-3 text-left">
                      <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        actividades[a.key].activa ? 'bg-primary-500 border-primary-500' : 'border-slate-300'
                      }`}>
                        {actividades[a.key].activa && <span className="text-white text-xs font-bold">✓</span>}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{a.label}</span>
                    </button>
                    {actividades[a.key].activa && (
                      <div className="px-3 pb-3">
                        <p className="text-xs text-slate-500 mb-2">Nivel de participación:</p>
                        <div className="flex gap-2">
                          {[
                            { v: 1, l: 'Baja', c: 'border-red-300 bg-red-50 text-red-700' },
                            { v: 2, l: 'Media', c: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
                            { v: 3, l: 'Alta', c: 'border-green-300 bg-green-50 text-green-700' },
                          ].map(opt => (
                            <button key={opt.v} type="button" onClick={() => setParticipacion(a.key, opt.v)}
                              className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                                actividades[a.key].participacion === opt.v ? opt.c + ' shadow-sm' : 'border-slate-200 text-slate-500'
                              }`}>{opt.l}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Notas libres ── */}
          <Card>
            <CardContent className="pt-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Observaciones adicionales <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">Solo para contexto puntual que no cabe en las métricas anteriores.</p>
              <textarea
                value={notasLibres}
                onChange={e => setNotasLibres(e.target.value)}
                rows={3}
                placeholder="Ej: Hubo una actividad nueva que generó ansiedad inicial pero se adaptó bien..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </CardContent>
          </Card>

          {/* ── Error y submit ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pb-8">
            <Link href="/dashboard"><Button variant="ghost" type="button">Cancelar</Button></Link>
            <Button type="submit" disabled={loading || loadingPago || bloqueado}>
              {loading ? 'Guardando...' : '💾 Guardar registro'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}