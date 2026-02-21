import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import NextImage from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <NextImage 
                  src="/pulsoAzulLogo.png" 
                  alt="Pulso Azul" 
                  width={120} 
                  height={40}
                  className="object-contain"
                />
                {/* Puedes quitar el texto "Pulso Azul" si ya está en el logo */}
              </div>
            <span className="text-2xl font-bold text-slate-900">Pulso Azul</span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link href="/auth/registro">
              <Button>Comenzar gratis</Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Mantén a todo el equipo{' '}
            <span className="text-primary-600">en la misma página</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            La plataforma que conecta a padres, maestras sombra y terapeutas 
            para el mejor cuidado de tu hijo. Comunicación simple, progreso visible.
          </p>

          <div className="flex gap-4 justify-center mb-20">
            <Link href="/auth/registro">
              <Button size="lg">
                Crear cuenta gratis
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Registro Diario</h3>
              <p className="text-slate-600">
                Documenta actividades, logros y desafíos en tiempo real. 
                Todo el equipo actualizado al instante.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguimiento Visual</h3>
              <p className="text-slate-600">
                Ve el progreso de tu hijo a lo largo del tiempo. 
                Reportes simples para compartir con médicos.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Equipo Conectado</h3>
              <p className="text-slate-600">
                Invita a maestras y terapeutas fácilmente. 
                Permisos personalizados para cada rol.
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-32 pt-8 border-t border-slate-200 text-center text-slate-600">
          <p>&copy; 2025 Pulso. Hecho con ❤️ para familias extraordinarias.</p>
        </footer>
      </div>
    </div>
  )
}
