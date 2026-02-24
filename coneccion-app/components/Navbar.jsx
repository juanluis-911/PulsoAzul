'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import {
  Home, FileText, TrendingUp, UserPlus, LogOut,
  Users, Download, Bell, ChevronLeft, ChevronRight, Menu, X, BookOpen, HelpCircle, Target
} from 'lucide-react'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { useSubscription } from '@/hooks/useSubscription'

export function Navbar({ user }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed]     = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [metasActivas, setMetasActivas] = useState(0)   // ← NUEVO
  const { estado, activar, desactivar } = useNotificaciones()
  const { subscription, isActive, openPortal } = useSubscription()

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // ── Cargar conteo de metas activas ────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchMetasActivas = async () => {
      const sb = createClient()

      // Obtener niños del usuario (como padre o como equipo)
      const [{ data: ninosPadre }, { data: equipoData }] = await Promise.all([
        sb.from('ninos').select('id').eq('padre_id', user.id),
        sb.from('equipo_terapeutico').select('nino_id').eq('usuario_id', user.id),
      ])

      const ninoIds = [
        ...new Set([
          ...(ninosPadre || []).map(n => n.id),
          ...(equipoData || []).map(e => e.nino_id),
        ])
      ]

      if (!ninoIds.length) return

      const { count } = await sb
        .from('metas')
        .select('id', { count: 'exact', head: true })
        .in('nino_id', ninoIds)
        .eq('estado', 'activa')

      setMetasActivas(count || 0)
    }

    fetchMetasActivas()
  }, [user, pathname]) // se recalcula al navegar
  // ─────────────────────────────────────────────────────────────────────

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
    { href: '/dashboard', label: 'Inicio',            icon: Home },
    { href: '/historial', label: 'Registros Diarios', icon: BookOpen },
    { href: '/metas',     label: 'Metas',             icon: Target,     badge: metasActivas },
    { href: '/progreso',  label: 'Progreso',           icon: TrendingUp },
    { href: '/equipo',    label: 'Red de apoyo',       icon: Users },
    { href: '/invitar',   label: 'Invitar',            icon: UserPlus },
    { href: '/ayuda',     label: 'Ayuda',              icon: HelpCircle },
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
          ${isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
          disabled:opacity-50`}
      >
        <Bell className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <span className="truncate">
            {isActive
              ? estado === 'desactivando' ? 'Desactivando...' : 'Notif. activas'
              : estado === 'solicitando'  ? 'Activando...'    : 'Notificaciones'}
          </span>
        )}
      </button>
    )
  }

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">

      {/* Logo + toggle */}
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
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const showBadge = badge > 0
          return (
            <Link
              key={href}
              href={href}
              title={collapsed && !mobile ? label : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }
                ${collapsed && !mobile ? 'justify-center' : ''}`}
            >
              {/* Ícono con badge superpuesto cuando está colapsado */}
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {/* Badge en modo colapsado (sobre el ícono) */}
                {showBadge && collapsed && !mobile && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5
                                   bg-red-500 text-white text-[9px] font-bold rounded-full
                                   flex items-center justify-center leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>

              {/* Label + badge inline cuando está expandido */}
              {(!collapsed || mobile) && (
                <>
                  <span className="truncate flex-1">{label}</span>
                  {showBadge && (
                    <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                                     flex items-center justify-center leading-none shrink-0
                                     ${active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </>
              )}
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
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8">
            <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={32} height={32} className="object-contain" priority />
          </div>
          <span className="font-bold text-slate-900">Pulso Azul</span>
        </Link>

        {/* Badge en mobile top bar */}
        {metasActivas > 0 && (
          <Link href="/metas" className="ml-auto flex items-center gap-1.5 bg-red-500 text-white
                                         text-xs font-bold px-2.5 py-1 rounded-full">
            <Target className="w-3 h-3" />
            {metasActivas > 99 ? '99+' : metasActivas} meta{metasActivas !== 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
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