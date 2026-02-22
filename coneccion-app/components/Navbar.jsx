'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Home, FileText, TrendingUp, UserPlus, LogOut, Menu, X, Users, Download, Bell, BellOff } from 'lucide-react'
import { useNotificaciones } from '@/hooks/useNotificaciones'

export function Navbar({ user }) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const { estado, activar } = useNotificaciones()

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShowInstall(false)
    setInstallPrompt(null)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard',       label: 'Inicio',         icon: Home },
    { href: '/registro-diario', label: 'Nuevo Registro', icon: FileText },
    { href: '/progreso',        label: 'Progreso',       icon: TrendingUp },
    { href: '/equipo',          label: 'Red de apoyo',   icon: Users },
    { href: '/invitar',         label: 'Invitar',        icon: UserPlus },
  ]

  // Botón de notificaciones reutilizable
  const NotifButton = ({ mobile = false }) => {
    if (estado === 'no-soportado' || estado === 'denegado') return null

    if (estado === 'activo') {
      return (
        <span className={`flex items-center gap-1.5 text-sm text-green-600 font-medium ${mobile ? 'px-4 py-2' : ''}`}>
          <Bell className="w-4 h-4" />
          Notificaciones activas
        </span>
      )
    }

    return (
      <button
        onClick={activar}
        disabled={estado === 'solicitando'}
        className={`flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors disabled:opacity-60 ${mobile ? 'px-4 py-2 hover:bg-purple-50 rounded-lg w-full' : ''}`}
      >
        <Bell className="w-4 h-4" />
        {estado === 'solicitando' ? 'Activando...' : 'Activar notificaciones'}
      </button>
    )
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center overflow-hidden">
              <NextImage
                src="/pulsoAzulLogo.png"
                alt="Pulso Azul"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 hidden sm:block">
              Pulso Azul
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu Desktop */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {/* Notificaciones push - desktop */}
              <NotifButton />

              {showInstall && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInstall}
                  className="flex items-center gap-2 border-primary-300 text-primary-600 hover:bg-primary-50"
                >
                  <Download className="w-4 h-4" />
                  Instalar app
                </Button>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {user?.user_metadata?.nombre_completo || user?.email}
                </p>
                <p className="text-xs text-slate-500">Padre/Madre</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col gap-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}

              {/* Notificaciones push - mobile */}
              <NotifButton mobile />

              {showInstall && (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar app</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}