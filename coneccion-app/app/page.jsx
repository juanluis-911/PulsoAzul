'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Button } from '@/components/ui/Button'

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    emoji: '📝',
    title: 'Registro Diario Estructurado',
    desc: 'Documenta estado de ánimo, actividades, logros y desafíos en segundos. Todo el equipo recibe la actualización al instante.',
    bg: 'bg-blue-50',
  },
  {
    emoji: '📊',
    title: 'Progreso Visible',
    desc: 'Gráficas y timeline que muestran la evolución de tu hijo semana a semana. Reportes listos para compartir con médicos.',
    bg: 'bg-emerald-50',
  },
  {
    emoji: '👥',
    title: 'Equipo Conectado',
    desc: 'Invita a maestras sombra y terapeutas con un link. Permisos personalizados para que cada quien vea lo que necesita.',
    bg: 'bg-amber-50',
  },
  {
    emoji: '🔔',
    title: 'Notificaciones en Tiempo Real',
    desc: 'Cuando alguien del equipo registra algo, tú te enteras de inmediato. Sin esperar al reporte de fin de semana.',
    bg: 'bg-rose-50',
  },
  {
    emoji: '📄',
    title: 'Exportación a PDF',
    desc: 'Genera reportes profesionales para llevar a consultas médicas o reuniones escolares con un solo clic.',
    bg: 'bg-violet-50',
  },
  {
    emoji: '🔒',
    title: 'Privacidad y Control',
    desc: 'Tú decides quién accede a la información de tu hijo. Cada rol tiene permisos definidos y seguros.',
    bg: 'bg-teal-50',
  },
]

const ROLES = [
  {
    emoji: '👨‍👩‍👧',
    role: 'Para Padres',
    color: 'from-blue-50 to-indigo-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    items: [
      'Crea y gestiona el perfil de tu hijo',
      'Invita a todo el equipo terapéutico',
      'Ve todos los registros en un solo lugar',
      'Exporta reportes para consultas médicas',
      'Controla los accesos en cualquier momento',
    ],
    panelCards: [
      { icon: '📊', bg: 'bg-blue-50', title: 'Resumen del día de Mateo', sub: '3 registros · 2 logros · Sin incidentes', badge: 'Hoy', badgeCls: 'bg-blue-100 text-blue-700' },
      { icon: '📈', bg: 'bg-emerald-50', title: 'Progreso semanal', sub: 'Semana 3 de Marzo — 87% días positivos', badge: '+12%', badgeCls: 'bg-emerald-100 text-emerald-700' },
      { icon: '📄', bg: 'bg-amber-50', title: 'Reporte para pediatra', sub: 'Listo para exportar · 4 semanas de data', badge: 'Listo', badgeCls: 'bg-violet-100 text-violet-700' },
    ],
  },
  {
    emoji: '🧑‍🏫',
    role: 'Para Maestras Sombra',
    color: 'from-purple-50 to-fuchsia-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    items: [
      'Accede al perfil del niño de forma segura',
      'Registra el día escolar con un formulario simple',
      'Ve el historial de registros del equipo',
      'Recibe notificaciones de nuevas actualizaciones',
    ],
    panelCards: [
      { icon: '✏️', bg: 'bg-emerald-50', title: 'Registro de hoy', sub: 'Completado en 2 min', badge: 'Enviado', badgeCls: 'bg-emerald-100 text-emerald-700' },
      { icon: '📋', bg: 'bg-blue-50', title: 'Contexto del alumno', sub: 'Historial · Diagnóstico · Terapias', badge: 'Disponible', badgeCls: 'bg-blue-100 text-blue-700' },
      { icon: '🔔', bg: 'bg-violet-50', title: 'Alerta del equipo', sub: 'Mamá reportó noche difícil — tener en cuenta', badge: 'Leído', badgeCls: 'bg-violet-100 text-violet-700' },
    ],
  },
  {
    emoji: '🩺',
    role: 'Para Terapeutas',
    color: 'from-emerald-50 to-teal-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    items: [
      'Consulta el historial completo del niño',
      'Agrega notas terapéuticas por sesión',
      'Sigue la evolución entre sesiones',
      'Coordina con el equipo sin intermediarios',
    ],
    panelCards: [
      { icon: '🗓️', bg: 'bg-violet-50', title: 'Sesión de hoy — Mateo', sub: 'Historial de 3 semanas disponible', badge: 'Hoy', badgeCls: 'bg-emerald-100 text-emerald-700' },
      { icon: '📈', bg: 'bg-emerald-50', title: 'Tendencias conductuales', sub: 'Mejoría en habilidades sociales', badge: '+22%', badgeCls: 'bg-blue-100 text-blue-700' },
      { icon: '📝', bg: 'bg-amber-50', title: 'Mis notas de sesión', sub: '12 sesiones documentadas · Compartidas', badge: 'Sync', badgeCls: 'bg-violet-100 text-violet-700' },
    ],
  },
]

const STEPS = [
  { num: '01', title: 'Crea el perfil de tu hijo', desc: 'Regístrate gratis y configura el perfil con los datos básicos de tu hijo en menos de 2 minutos.' },
  { num: '02', title: 'Invita a tu equipo', desc: 'Envía un link a la maestra sombra y al terapeuta. Ellos se registran y tienen acceso inmediato.' },
  { num: '03', title: 'Empiecen a registrar juntos', desc: 'Cada miembro documenta su parte del día. Tú ves todo consolidado en un solo dashboard.' },
]

const TESTIMONIOS = [
  {
    stars: 5,
    quote: '"Antes tardaba 20 minutos al inicio de cada sesión poniendo al terapeuta al día. Ahora llega sabiendo exactamente cómo estuvo la semana. Las sesiones son mucho más productivas."',
    nombre: 'María, mamá de Lucas',
    rol: 'Ciudad de México · TEA',
    avatarBg: 'bg-blue-100',
    emoji: '👩',
  },
  {
    stars: 5,
    quote: '"Como maestra sombra, por fin puedo ver qué pasó en terapia y en casa. Eso me ayuda a adaptar mis estrategias en el aula de forma inmediata. Es una herramienta increíble."',
    nombre: 'Sofía, Maestra Sombra',
    rol: 'Guadalajara · 3 años de experiencia',
    avatarBg: 'bg-emerald-100',
    emoji: '🧑‍🏫',
  },
  {
    stars: 5,
    quote: '"El reporte en PDF me ha salvado en varias consultas con neurólogos. Llevo datos reales y el médico puede ver patrones que antes eran invisibles."',
    nombre: 'Carlos, papá de Valentina',
    rol: 'Monterrey · TDAH + Ansiedad',
    avatarBg: 'bg-violet-100',
    emoji: '👨',
  },
]

// ── Componentes ───────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY
      const docH = document.documentElement.scrollHeight - window.innerHeight
      setScrolled(scrollY > 40)
      setProgress(docH > 0 ? Math.min(100, (scrollY / docH) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100'
        : 'bg-transparent'
    }`}>
      {/* Barra de progreso de lectura */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-teal-400 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
      <nav className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <NextImage
            src="/pulsoAzulLogo.png"
            alt="Pulso Azul"
            width={110}
            height={36}
            className="object-contain"
            priority
          />
        </Link>

        {/* Links de navegación */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">Cómo funciona</a>
          <a href="#funcionalidades" className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">Funcionalidades</a>
          <a href="#roles" className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">Para quién</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium hidden md:block">
            Iniciar sesión
          </Link>
          <Link href="/auth/registro">
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full px-5 shadow-md shadow-blue-200 font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Comenzar gratis ✦
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center pt-10 pb-20 px-6">
      {/* Background blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50/60" />
      <div className="absolute top-[-80px] right-[-120px] w-[500px] h-[500px] bg-blue-200/25 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-60px] left-[-80px] w-[420px] h-[420px] bg-teal-200/20 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_reverse]" />
      <div className="absolute top-[30%] left-[38%] w-[250px] h-[250px] bg-amber-200/15 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite_2s]" />

      <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        {/* Left side */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-full px-4 py-2 text-xs font-semibold mb-8 animate-[fadeInUp_0.8s_ease_both]">
            🧩 Diseñado para familias con niños neurodivergentes
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight animate-[fadeInUp_0.8s_ease_0.1s_both]">
            Todo el equipo<br/>de tu hijo,<br/>
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>

          <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-lg animate-[fadeInUp_0.8s_ease_0.2s_both]">
            Conecta a padres, maestras sombra y terapeutas para compartir registros diarios, seguir el progreso y tomar mejores decisiones juntos.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10 animate-[fadeInUp_0.8s_ease_0.3s_both]">
            <Link href="/auth/registro">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full px-8 py-5 text-base font-bold shadow-xl shadow-blue-200 transition-all hover:shadow-2xl hover:-translate-y-1"
              >
                Crear cuenta gratis →
              </Button>
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors text-base border border-slate-200 rounded-full px-6 py-3 hover:border-blue-300 bg-white/80 backdrop-blur-sm hover:-translate-y-0.5 transition-all"
            >
              ▶ Cómo funciona
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 animate-[fadeInUp_0.8s_ease_0.4s_both]">
            <div className="flex -space-x-2">
              {['bg-emerald-200', 'bg-amber-200', 'bg-pink-200', 'bg-blue-200'].map((bg, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-sm ${bg}`}
                >
                  {['👩', '👨', '👩', '👨'][i]}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">+100 familias</span> ya confían en Pulso Azul<br />
              <span className="text-slate-400 text-xs">Sin tarjeta de crédito · Cancela cuando quieras</span>
            </div>
          </div>
        </div>

        {/* Right side: App mockup */}
        <div className="relative">
          {/* Floating card top */}
          <div className="absolute -top-4 -right-4 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3 animate-[float_6s_ease-in-out_infinite]">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-base">📈</div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Progreso esta semana</p>
              <p className="text-sm font-bold text-slate-800">+3 logros nuevos ✨</p>
            </div>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold text-sm">Dashboard de Mateo</h4>
                <p className="text-slate-400 text-xs mt-0.5">Hoy, 8 de Marzo 2026</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_0_4px_rgba(52,211,153,0.25)] animate-pulse" />
            </div>

            {/* Registros */}
            <div className="divide-y divide-slate-50">
              {[
                { avatar: '👩', bgAvatar: 'bg-blue-50', role: 'Mamá', roleColor: 'text-blue-600', msg: 'Mateo desayunó bien y llegó tranquilo al colegio. Durmió sus 8 horas.', time: '07:45 am' },
                { avatar: '🧑‍🏫', bgAvatar: 'bg-emerald-50', role: 'Maestra Sombra', roleColor: 'text-emerald-600', msg: 'Excelente día. Participó en matemáticas. Sin episodios de ansiedad.', time: '02:30 pm' },
                { avatar: '🩺', bgAvatar: 'bg-violet-50', role: 'Terapeuta', roleColor: 'text-violet-600', msg: 'Sesión productiva. Los registros previos del equipo fueron muy útiles.', time: '05:00 pm' },
              ].map((r, i) => (
                <div key={i} className="flex gap-3 px-5 py-4 items-start">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${r.bgAvatar}`}>
                    {r.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${r.roleColor}`}>{r.role}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{r.msg}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{r.time}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 flex-shrink-0">✓ Listo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating card bottom */}
          <div className="absolute -bottom-4 -left-4 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3 animate-[float_6s_ease-in-out_2s_infinite]">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-base">🔔</div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Notificación</p>
              <p className="text-sm font-bold text-slate-800">La maestra registró el día</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="py-24 px-6 bg-slate-900 relative overflow-hidden">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23fff%22 fill-rule=%22evenodd%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/svg%3E')]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto relative">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">⚡ El problema real</p>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
          Coordinar el cuidado de tu hijo<br/>
          <span className="text-slate-400">no debería ser tan difícil</span>
        </h2>
        <p className="text-slate-400 text-lg mb-14 max-w-xl">
          Cuando la información está dispersa, todos trabajan en silos. Tu hijo lo merece mejor.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: '📓', title: 'El cuaderno llega sin contexto', desc: 'La maestra te manda un cuaderno al final de la semana y ya no recuerdas qué pasó el lunes.' },
            { icon: '📞', title: 'El terapeuta empieza desde cero', desc: 'No sabe lo que pasó en el colegio y tú tienes que repetirle todo al inicio de cada sesión.' },
            { icon: '😔', title: 'Cada quien trabaja por su lado', desc: 'No hay visión unificada del progreso. Los avances se pierden. El equipo no se comunica.' },
          ].map((p, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/8 rounded-2xl p-7 hover:bg-white/8 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 group"
            >
              <span className="text-4xl block mb-5">{p.icon}</span>
              <h3 className="text-white font-bold text-base mb-3">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Resolution banner */}
        <div className="mt-10 bg-gradient-to-r from-blue-600/15 to-teal-600/15 border border-teal-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white text-2xl font-bold mb-2">Pulso Azul resuelve exactamente esto. 💙</h3>
            <p className="text-slate-400 text-base">Una sola plataforma donde padres, maestras y terapeutas comparten en tiempo real.</p>
          </div>
          <Link href="/auth/registro" className="flex-shrink-0">
            <Button className="bg-white text-slate-900 hover:bg-blue-50 rounded-full px-7 py-3 font-bold shadow-lg">
              Empezar ahora →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">✦ Proceso simple</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Empezar es muy fácil</h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">En menos de 5 minutos tienes a todo tu equipo conectado.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.7%+20px)] right-[calc(16.7%+20px)] h-0.5 bg-gradient-to-r from-blue-300 via-blue-400 to-teal-400 z-0" />

          {STEPS.map((s, i) => (
            <div key={s.num} className="relative z-10 text-center">
              <div className="w-[104px] h-[104px] rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center text-3xl font-black mx-auto mb-7 shadow-xl shadow-blue-200 border-4 border-white hover:scale-110 hover:shadow-2xl transition-all duration-300 cursor-default">
                {s.num}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-3">✦ Funcionalidades</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Todo lo que necesitas,<br/>nada que no necesitas</h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">Simple, enfocado y hecho para el día a día de tu familia.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`${f.bg} rounded-2xl p-7 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl mb-5">
                {f.emoji}
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-3">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ForWhoSection() {
  const [activeTab, setActiveTab] = useState(0)
  const role = ROLES[activeTab]

  return (
    <section id="roles" className="py-24 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">✦ Para todo el equipo</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Hecho para cada rol</h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">Cada miembro tiene exactamente lo que necesita, sin distracciones.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {ROLES.map((r, i) => (
            <button
              key={r.role}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm border transition-all duration-200 ${
                activeTab === i
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-transparent shadow-lg shadow-blue-200 -translate-y-0.5'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {r.emoji} {r.role}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className={`inline-flex items-center gap-2 ${role.badge} rounded-full px-4 py-1.5 text-xs font-bold mb-5`}>
              {role.emoji} {role.role}
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4">
              {activeTab === 0 && 'El centro de control de tu hijo'}
              {activeTab === 1 && 'Registra el día escolar en segundos'}
              {activeTab === 2 && 'Sesiones más efectivas con contexto real'}
            </h3>
            <p className="text-slate-500 mb-7 leading-relaxed">
              {activeTab === 0 && 'Como padre o madre, tienes visibilidad completa de todo lo que sucede: en casa, en el colegio y en terapia.'}
              {activeTab === 1 && 'Accede al perfil del niño de forma segura y documenta lo que pasó en el aula con un formulario rápido.'}
              {activeTab === 2 && 'Consulta el historial completo antes de cada sesión. Ya no pierdes tiempo preguntando. El contexto está ahí.'}
            </p>
            <ul className="space-y-3.5">
              {role.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            {role.panelCards.map((card, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:bg-white hover:shadow-md hover:translate-x-1 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${card.bg}`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${card.badgeCls}`}>
                  {card.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimoniosSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-3">✦ Familias reales</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Lo que dicen las familias<br/>que ya lo usan
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIOS.map((t, i) => (
            <div
              key={i}
              className="bg-slate-50 rounded-2xl p-7 border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex gap-0.5 mb-5">
                {[...Array(t.stars)].map((_, j) => (
                  <span key={j} className="text-amber-400 text-base">★</span>
                ))}
              </div>
              <blockquote className="text-slate-700 text-sm leading-relaxed mb-6 italic">{t.quote}</blockquote>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${t.avatarBg}`}>
                  {t.emoji}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.nombre}</p>
                  <p className="text-xs text-slate-400">{t.rol}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-28 px-6 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white text-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-white/5 rounded-full" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[350px] h-[350px] bg-teal-400/15 rounded-full blur-2xl" />

      <div className="relative max-w-3xl mx-auto">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-5">💙 Únete a Pulso Azul</p>
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
          Dale a tu hijo el equipo<br/>que merece
        </h2>
        <p className="text-blue-200 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
          Empieza gratis hoy. Sin tarjeta de crédito, sin complicaciones.
          Solo un equipo unido trabajando por tu hijo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <Link href="/auth/registro">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 px-10 py-5 text-base font-extrabold shadow-2xl rounded-full transition-all hover:shadow-white/20 hover:-translate-y-1"
            >
              Crear cuenta gratis →
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="ghost"
              className="text-white border-2 border-white/25 hover:bg-white/10 hover:border-white/40 rounded-full px-8 py-5 font-semibold"
            >
              Ya tengo cuenta
            </Button>
          </Link>
        </div>

        <p className="text-blue-300/70 text-sm">
          ✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Cancela cuando quieras &nbsp;·&nbsp; ✓ Setup en 5 min
        </p>

        {/* Stats */}
        <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: '+100', label: 'Familias activas' },
            { number: '5 min', label: 'Para configurar' },
            { number: '100%', label: 'Gratis para empezar' },
            { number: '3', label: 'Roles integrados' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-4xl font-black text-white/90 leading-none mb-2">{s.number}</p>
              <p className="text-blue-300/60 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-500 py-14 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={100} height={34} className="object-contain opacity-80" />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Comunicación y seguimiento para familias con niños neurodivergentes. Hecho con amor para familias extraordinarias.
            </p>
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-5">Producto</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/auth/registro" className="hover:text-white transition-colors">Registro</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Iniciar sesión</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Precios</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-5">Para quién</h4>
            <ul className="space-y-3 text-sm">
              <li><span className="hover:text-white transition-colors cursor-default">Padres</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Maestras Sombra</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Terapeutas</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2025 Pulso Azul. Hecho con ❤️ para familias extraordinarias.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20">
        <Hero />
      </div>
      <ProblemSection />
      <HowItWorks />
      <FeaturesSection />
      <ForWhoSection />
      <TestimoniosSection />
      <CTASection />
      <Footer />
    </div>
  )
}