'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, FileText, BarChart2, BookOpen, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

// ─── Datos ────────────────────────────────────────────────────────────────────

const SECCIONES = [
  {
    id: 'registro',
    icon: FileText,
    color: 'bg-primary-100 text-primary-600',
    titulo: '¿Cómo hacer un nuevo registro?',
    preguntas: [
      {
        q: '¿Qué es el Registro Diario?',
        a: 'Es el formulario principal de Pulso Azul. Te permite documentar cada sesión o día de trabajo con el niño: su estado emocional, conducta, comunicación, habilidades sociales, motoras, académicas y más. Toda la información queda disponible para el equipo al instante.',
      },
      {
        q: '¿Cómo accedo al formulario?',
        a: 'Desde el Dashboard, toca el botón "Nuevo registro" o ve al menú lateral y selecciona "Registro Diario". Si tienes más de un niño asignado, lo primero que harás es elegir a cuál corresponde el registro.',
      },
      {
        q: '¿Qué secciones tiene el formulario?',
        a: (
          <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-sm">
            <li><strong>Contexto del día</strong> — Sueño, alimentación, medicamento, cambios de rutina o eventos estresantes.</li>
            <li><strong>Regulación emocional</strong> — Escala 1–5 al inicio y al final del día.</li>
            <li><strong>Conducta</strong> — Frecuencia de conductas disruptivas y duración estimada.</li>
            <li><strong>Nivel de apoyo general</strong> — Desde "independiente" hasta "apoyo físico total".</li>
            <li><strong>Comunicación y lenguaje</strong> — Iniciativa comunicativa y claridad del mensaje (1–5).</li>
            <li><strong>Habilidades sociales</strong> — Interacción con pares y espera de turnos (1–5).</li>
            <li><strong>Autonomía</strong> — Higiene y alimentación (1–5).</li>
            <li><strong>Habilidades académicas</strong> — Atención y persistencia (1–5).</li>
            <li><strong>Habilidades motoras</strong> — Motricidad fina y gruesa (1–5).</li>
            <li><strong>Actividades realizadas</strong> — Selecciona las actividades del día y el nivel de participación.</li>
            <li><strong>Notas libres</strong> — Espacio abierto para observaciones, estrategias o comentarios clínicos.</li>
          </ol>
        ),
      },
      {
        q: '¿Tengo que llenar todas las secciones?',
        a: 'No. Solo los campos marcados con asterisco (*) son obligatorios (como regulación emocional y nivel de apoyo). El resto puedes completarlo según lo que corresponda a tu sesión o contexto.',
      },
      {
        q: '¿Qué pasa después de guardar?',
        a: 'El registro se guarda de inmediato y el sistema envía una notificación automática a los demás miembros del equipo (padres, maestra sombra, otros terapeutas). Todos podrán verlo desde su Dashboard o desde la sección de Progreso.',
      },
      {
        q: 'No puedo guardar el registro, aparece un aviso amarillo. ¿Qué hago?',
        a: 'Ese aviso indica que el padre del niño no tiene una suscripción activa en la plataforma. Los registros no pueden guardarse hasta que el padre regularice su cuenta. Comunícate con la familia para informarles.',
      },
    ],
  },
  {
    id: 'registros-guardados',
    icon: BookOpen,
    color: 'bg-violet-100 text-violet-600',
    titulo: '¿Cómo revisar los registros guardados?',
    preguntas: [
      {
        q: '¿Dónde veo los registros del equipo?',
        a: 'En el Dashboard verás los registros más recientes de todos los miembros del equipo. Para ver el historial completo, ve a la sección "Progreso" desde el menú lateral o desde el perfil del niño.',
      },
      {
        q: '¿Puedo ver los registros que hicieron los padres o la maestra sombra?',
        a: 'Sí. Todos los miembros del equipo tienen visibilidad de los registros de todos. Cada tarjeta muestra quién creó el registro y desde qué rol (padre, maestra sombra o terapeuta).',
      },
      {
        q: '¿Cómo identifico quién hizo cada registro?',
        a: 'En la parte inferior de cada tarjeta de registro verás una etiqueta de color con el nombre del autor y su rol. Por ejemplo: "Ana · Terapeuta" o "Mamá · Padre".',
      },
      {
        q: '¿Puedo ver solo los registros de un niño específico?',
        a: 'Sí. En la sección de Progreso puedes filtrar por niño usando el selector en la parte superior de la pantalla. Si solo tienes un niño asignado, los registros ya estarán filtrados automáticamente.',
      },
      {
        q: '¿Puedo editar un registro que ya guardé?',
        a: 'Esta función no está disponible en la versión actual. Si necesitas agregar información, puedes hacerlo en las notas libres de un nuevo registro del mismo día, indicando que es una corrección o complemento.',
      },
      {
        q: '¿Puedo filtrar registros por fecha o contexto?',
        a: 'Sí, desde la sección Progreso puedes filtrar por periodo (última semana, último mes o todo el historial) y por contexto (escuela, casa, terapia o todos). Los registros y las gráficas se actualizan automáticamente con cada filtro.',
      },
    ],
  },
  {
    id: 'progreso',
    icon: BarChart2,
    color: 'bg-emerald-100 text-emerald-600',
    titulo: '¿Cómo interpretar la sección Progreso?',
    preguntas: [
      {
        q: '¿Qué es la sección Progreso?',
        a: 'Es el panel de análisis de la plataforma. Convierte todos los registros del niño en gráficas, métricas e indicadores que te permiten ver su evolución a lo largo del tiempo de forma visual y rápida.',
      },
      {
        q: '¿Qué son las tarjetas KPI?',
        a: 'Los KPI (indicadores clave) son 6 tarjetas en la parte superior: Regulación, Comunicación, Social, Académico, Motora y Autonomía. Cada una muestra el promedio del niño en esa área durante el periodo seleccionado y una flecha de tendencia: ↑ mejorando, ↓ bajando, → estable.',
      },
      {
        q: '¿Cómo leo la gráfica de "Perfil global de áreas"?',
        a: 'Es una gráfica de radar (telaraña) que muestra visualmente el promedio del niño en todas las áreas al mismo tiempo. Las áreas más "llenas" son sus fortalezas; las más "huecas" indican dónde necesita más apoyo.',
      },
      {
        q: '¿Qué me dice la gráfica "Contexto del día"?',
        a: 'Muestra en qué porcentaje de días estuvo presente cada factor de contexto (durmió bien, comió bien, tomó medicamento, hubo cambio de rutina, hubo evento estresante). Esto permite correlacionar condiciones del entorno con el comportamiento del niño.',
      },
      {
        q: '¿Cómo uso la gráfica de "Tendencia por área"?',
        a: 'Muestra la evolución de cada área semana a semana. Puedes activar o desactivar áreas con los botones de filtro para comparar solo las que te interesen. Si una línea sube sostenidamente, hay progreso real; si baja o zigzaguea, vale la pena revisar qué está pasando.',
      },
      {
        q: '¿Qué significa la gráfica "Regulación: inicio vs fin del día"?',
        a: 'Compara la regulación emocional al inicio y al final de cada sesión o día. Si la línea de "Fin" está consistentemente por encima de "Inicio", el niño termina sus días en mejor estado del que comienza, lo cual es un indicador positivo de progreso y de que las intervenciones están funcionando.',
      },
      {
        q: '¿Para qué sirve el botón "Analizar con IA"?',
        a: 'Genera un análisis clínico automático basado en todos los datos del periodo seleccionado. Incluye: fortalezas y áreas de atención, patrones de contexto, estrategias concretas para el equipo, un resumen ejecutivo listo para compartir con médicos u otros profesionales, y alertas si detecta algo que requiere atención urgente.',
      },
      {
        q: '¿El análisis de IA reemplaza mi criterio clínico?',
        a: 'No. Es una herramienta de apoyo para identificar patrones en los datos más rápido. El juicio clínico, la observación directa y el conocimiento del niño siempre tienen prioridad. Úsalo como un punto de partida para reflexión o para complementar tus reportes.',
      },
    ],
  },
]

// ─── Componente acordeón ──────────────────────────────────────────────────────

function Acordeon({ pregunta, respuesta }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="text-sm font-medium text-slate-800 group-hover:text-primary-600 transition-colors">
          {pregunta}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
        />
      </button>
      {abierto && (
        <div className="pb-4 text-sm text-slate-600 leading-relaxed">
          {typeof respuesta === 'string' ? <p>{respuesta}</p> : respuesta}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AyudaPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">

        {/* Volver */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Centro de ayuda</h1>
          <p className="text-slate-600 mt-1">
            Encuentra respuesta a las preguntas más comunes sobre el uso de Pulso Azul.
          </p>
        </div>

        {/* Índice de navegación rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {SECCIONES.map(s => {
            const Icon = s.icon
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-slate-700 leading-tight">{s.titulo}</span>
              </a>
            )
          })}
        </div>

        {/* Secciones acordeón */}
        <div className="space-y-6">
          {SECCIONES.map(s => {
            const Icon = s.icon
            return (
              <div key={s.id} id={s.id}>
                {/* Título de sección */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">{s.titulo}</h2>
                </div>

                {/* Acordeón */}
                <Card>
                  <CardContent className="px-5 py-0 divide-y divide-slate-100">
                    {s.preguntas.map((item, i) => (
                      <Acordeon key={i} pregunta={item.q} respuesta={item.a} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Footer de contacto */}
        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500">
            ¿No encontraste lo que buscabas?{' '}
            <a href="mailto:soporte@pulsoazul.com" className="text-primary-600 hover:underline font-medium">
              Contáctanos
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}