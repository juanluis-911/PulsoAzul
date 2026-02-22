'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import {
  Home, FileText, TrendingUp, UserPlus, LogOut,
  Users, Download, Bell, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { useSubscription } from '@/hooks/useSubscription'

export function Navbar({ user }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)   // desktop: colapsar a iconos
  const [mobileOpen, setMobileOpen] = useState(false) // mobile: drawer
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const { estado, activar, desactivar } = useNotificaciones()
  const { subscription, isActive, openPortal } = useSubscription()

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Cierra el drawer mobile al navegar
  useEffect(() => { setMobileOpen(false) }, [pathname])

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

  const displayName = user?.user_metadata?.nombre_completo || user?.email || ''
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const NotifButton = () => {
    if (estado === 'no-soportado' || estado === 'denegado') return null
    const isActive = estado === 'activo' || estado === 'desactivando'
    return (
      <button
        onClick={isActive ? desactivar : activar}
        disabled={estado === 'desactivando' || estado === 'solicitando'}
        title={isActive ? 'Desactivar notificaciones' : 'Activar notificaciones'}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all
          ${isActive
            ? 'text-green-600 hover:bg-green-50'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          } disabled:opacity-50`}
      >
        <Bell className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <span className="truncate">
            {isActive
              ? estado === 'desactivando' ? 'Desactivando...' : 'Notif. activas'
              : estado === 'solicitando' ? 'Activando...' : 'Notificaciones'}
          </span>
        )}
      </button>
    )
  }

  // ── Contenido compartido del sidebar ──────────────────────────────────
  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">

      {/* Logo + toggle (desktop) */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-100
        ${collapsed && !mobile ? 'justify-center' : 'justify-between'}`}>
        {(!collapsed || mobile) && (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 shrink-0">
              <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={36} height={36} className="object-contain" priority />
            </div>
            <span className="text-lg font-bold text-slate-900 truncate">Pulso Azul</span>
          </Link>
        )}
        {collapsed && !mobile && (
          <div className="w-9 h-9">
            <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={36} height={36} className="object-contain" priority />
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed && !mobile ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }
                ${collapsed && !mobile ? 'justify-center' : ''}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {(!collapsed || mobile) && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className={`px-3 py-4 border-t border-slate-100 space-y-1 ${collapsed && !mobile ? 'flex flex-col items-center' : ''}`}>
        <NotifButton />

        {showInstall && (!collapsed || mobile) && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-all"
          >
            <Download className="w-5 h-5 shrink-0" />
            <span>Instalar app</span>
          </button>
        )}

        {/* Suscripción */}
        {(!collapsed || mobile) && (
          <button
            onClick={openPortal}
            title="Gestionar suscripción"
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all
              ${isActive
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="flex-1 text-left truncate">
              {isActive ? 'Suscripción activa' : 'Sin suscripción activa'}
            </span>
            {isActive && subscription?.current_period_end && (
              <span className="text-emerald-500 opacity-70 text-[10px] shrink-0">
                {new Date(subscription.current_period_end).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </button>
        )}
        {(collapsed && !mobile) && (
          <button
            onClick={openPortal}
            title={isActive ? 'Suscripción activa' : 'Sin suscripción activa'}
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
              ${isActive ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </button>
        )}

        {/* Avatar + nombre */}
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 mt-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {initials || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500">Padre/Madre</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed && !mobile ? 'Cerrar sesión' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
            text-red-500 hover:bg-red-50 transition-all
            ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!collapsed || mobile) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── DESKTOP sidebar ─────────────────────────────── */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE top bar ──────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8">
            <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={32} height={32} className="object-contain" priority />
          </div>
          <span className="font-bold text-slate-900">Pulso Azul</span>
        </Link>
      </div>

      {/* ── MOBILE drawer ───────────────────────────────── */}
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {/* Drawer panel */}
      <aside className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 bg-white shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-3 right-3">
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent mobile />
      </aside>
    </>
  )
}