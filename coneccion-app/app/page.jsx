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
  },
  {
    emoji: '📊',
    title: 'Progreso Visible',
    desc: 'Gráficas y timeline que muestran la evolución de tu hijo semana a semana. Reportes listos para compartir con médicos.',
  },
  {
    emoji: '👥',
    title: 'Equipo Conectado',
    desc: 'Invita a maestras sombra y terapeutas con un link. Permisos personalizados para que cada quien vea lo que necesita.',
  },
  {
    emoji: '🔔',
    title: 'Notificaciones en Tiempo Real',
    desc: 'Cuando alguien del equipo registra algo, tú te enteras de inmediato. Sin esperar al reporte de fin de semana.',
  },
  {
    emoji: '📄',
    title: 'Exportación a PDF',
    desc: 'Genera reportes profesionales para llevar a consultas médicas o reuniones escolares con un solo clic.',
  },
  {
    emoji: '🔒',
    title: 'Privacidad y Control',
    desc: 'Tú decides quién accede a la información de tu hijo. Cada rol tiene permisos definidos y seguros.',
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
  },
]

const STEPS = [
  { num: '01', title: 'Crea el perfil de tu hijo', desc: 'Regístrate gratis y configura el perfil con los datos básicos de tu hijo en menos de 2 minutos.' },
  { num: '02', title: 'Invita a tu equipo', desc: 'Envía un link a la maestra sombra y al terapeuta. Ellos se registran y tienen acceso inmediato.' },
  { num: '03', title: 'Empiecen a registrar juntos', desc: 'Cada miembro documenta su parte del día. Tú ves todo consolidado en un solo dashboard.' },
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
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />

      <nav className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
        {/* Logo — siempre lleva al inicio */}
        <Link href="/" className="flex items-center gap-2 group">
          <NextImage
            src="/pulsoAzulLogo.png"
            alt="Pulso Azul"
            width={110}
            height={36}
            className="object-contain"
            priority
          />
        </Link>

        {/* Botón de volver arriba — aparece solo cuando hay scroll */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`hidden md:flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-all duration-300 ${
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          Volver al inicio
        </button>

        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button variant="ghost">Iniciar sesión</Button>
          </Link>
          <Link href="/auth/registro">
            <Button>Comenzar gratis</Button>
          </Link>
        </div>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
      {/* Badge */}
      <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
        🧩 Diseñado para familias con niños neurodivergentes
      </span>

      <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
        Todo el equipo de tu hijo,{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
          en un solo lugar
        </span>
      </h1>

      <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
        Conecta a padres, maestras sombra y terapeutas para compartir registros diarios,
        seguir el progreso y tomar mejores decisiones juntos.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/auth/registro">
          <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base">
            Crear cuenta gratis →
          </Button>
        </Link>
        <Link href="/auth/login">
          <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base">
            Ya tengo cuenta
          </Button>
        </Link>
      </div>

      <p className="text-sm text-slate-400 mt-4">Sin tarjeta de crédito. Cancela cuando quieras.</p>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="bg-slate-900 text-white py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          ¿Te suena familiar?
        </h2>
        <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
          Coordinar el cuidado de un niño neurodivergente es agotador cuando la información está dispersa.
        </p>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            { icon: '📓', text: 'La maestra te manda un cuaderno al final de la semana y ya no recuerdas el contexto.' },
            { icon: '📞', text: 'El terapeuta no sabe lo que pasó en el colegio y tú tienes que repetirle todo en la sesión.' },
            { icon: '😔', text: 'Sientes que cada quien trabaja por su lado y no hay una visión unificada del progreso de tu hijo.' },
          ].map((p, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <span className="text-3xl block mb-3">{p.icon}</span>
              <p className="text-slate-300 text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-xl font-semibold text-white">
          Pulso Azul resuelve exactamente esto. 💙
        </p>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Empezar es muy fácil</h2>
          <p className="text-slate-500 text-lg">En menos de 5 minutos tienes a todo tu equipo conectado.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.num} className="relative">
              <div className="text-6xl font-black text-blue-100 leading-none mb-2">{s.num}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
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
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Todo lo que necesitas, nada que no necesitas</h2>
          <p className="text-slate-500 text-lg">Simple, enfocado y hecho para el día a día de tu familia.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
              <span className="text-3xl block mb-3">{f.emoji}</span>
              <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ForWhoSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Hecho para todo el equipo</h2>
          <p className="text-slate-500 text-lg">Cada rol tiene exactamente lo que necesita.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {ROLES.map((r) => (
            <div key={r.role} className={`rounded-2xl border p-6 bg-gradient-to-br ${r.color}`}>
              <span className="text-3xl block mb-3">{r.emoji}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.badge} inline-block mb-4`}>
                {r.role}
              </span>
              <ul className="space-y-2">
                {r.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
          Dale a tu hijo el equipo que merece
        </h2>
        <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto">
          Empieza gratis hoy. Sin tarjeta de crédito, sin complicaciones.
          Solo un equipo unido trabajando por tu hijo.
        </p>
        <Link href="/auth/registro">
          <Button
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 px-10 py-4 text-base font-bold shadow-lg"
          >
            Crear cuenta gratis →
          </Button>
        </Link>
        <p className="text-blue-300 text-sm mt-4">Más de 100 familias ya confían en Pulso Azul</p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={90} height={30} className="object-contain opacity-70" />
        </div>
        <div className="flex gap-6 text-sm">
          <Link href="/auth/registro" className="hover:text-white transition-colors">Registro</Link>
          <Link href="/auth/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Precios</Link>
        </div>
        <p className="text-sm">© 2025 Pulso Azul. Hecho con ❤️ para familias extraordinarias.</p>
      </div>
    </footer>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Navbar />
        <div className="pt-20"> {/* compensar el header fixed */}
          <Hero />
        </div>
      </div>
      <ProblemSection />
      <HowItWorks />
      <FeaturesSection />
      <ForWhoSection />
      <CTASection />
      <Footer />
    </div>
  )
}