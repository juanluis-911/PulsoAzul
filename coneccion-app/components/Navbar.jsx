'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Home, FileText, TrendingUp, UserPlus, LogOut,
  Users, Download, Bell, ChevronLeft, ChevronRight, Menu, X, BookOpen, HelpCircle, Target, MessageCircle, Clock, Zap, Trophy, Network, Newspaper, LayoutGrid
} from 'lucide-react'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { useSubscription } from '@/hooks/useSubscription'
import { useTrialDias } from '@/hooks/useTrialDias'

export function Navbar({ user }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed]         = useState(false)
  const [mobileOpen, setMobileOpen]       = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall]     = useState(false)
  const [metasActivas, setMetasActivas]   = useState(0)
  const [perfil, setPerfil]               = useState(null)
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0)
  const [logrosInfo, setLogrosInfo]       = useState({ count: 0, nivel: null })

  const { estado, activar, desactivar }   = useNotificaciones()
  const { subscription, isActive, openPortal } = useSubscription()
  const { diasRestantes, enTrial, trialVencido } = useTrialDias()

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // ── Cargar perfil del usuario ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchPerfil = async () => {
      const sb = createClient()
      const { data } = await sb.from('perfiles')
        .select('nombre_completo, rol_principal')
        .eq('id', user.id).maybeSingle()
      setPerfil(data)
    }
    fetchPerfil()
  }, [user])

  // ── Cargar conteo de metas activas ────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchMetasActivas = async () => {
      const sb = createClient()
      const [{ data: ninosPadre }, { data: equipoData }] = await Promise.all([
        sb.from('ninos').select('id').eq('padre_id', user.id),
        sb.from('equipo_terapeutico').select('nino_id').eq('usuario_id', user.id),
      ])
      const ninoIds = [...new Set([
        ...(ninosPadre || []).map(n => n.id),
        ...(equipoData || []).map(e => e.nino_id),
      ])]
      if (!ninoIds.length) return
      const { count } = await sb
        .from('metas')
        .select('id', { count: 'exact', head: true })
        .in('nino_id', ninoIds)
        .eq('estado', 'activa')
      setMetasActivas(count || 0)
    }
    fetchMetasActivas()
  }, [user, pathname])

  // ── Cargar mensajes no leídos ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchNoLeidos = async () => {
      const sb = createClient()
      const [{ data: ninosPadre }, { data: equipoData }] = await Promise.all([
        sb.from('ninos').select('id').eq('padre_id', user.id),
        sb.from('equipo_terapeutico').select('nino_id').eq('usuario_id', user.id),
      ])
      const ninoIds = [...new Set([
        ...(ninosPadre || []).map(n => n.id),
        ...(equipoData || []).map(e => e.nino_id),
      ])]
      if (!ninoIds.length) { setMensajesNoLeidos(0); return }
      const { count } = await sb
        .from('mensajes')
        .select('id', { count: 'exact', head: true })
        .in('nino_id', ninoIds)
        .neq('autor_id', user.id)
        .not('leido_por', 'cs', `{${user.id}}`)
      setMensajesNoLeidos(count || 0)
    }
    fetchNoLeidos()
  }, [user, pathname])

  // ── Cargar logros del usuario ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchLogros = async () => {
      const sb = createClient()
      const { data } = await sb
        .from('logros_usuario')
        .select('logro_id')
        .eq('usuario_id', user.id)
      const count = (data || []).length
      // Determinar nivel más alto alcanzado
      const ORDEN = ['bronce', 'plata', 'oro', 'platino', 'diamante']
      const NIVEL_LABEL = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro', platino: 'Platino', diamante: 'Diamante' }
      // Importar definiciones para mapear logro_id → nivel
      const { LOGROS_MAP } = await import('@/lib/logros-definicion')
      const niveles = (data || []).map(l => LOGROS_MAP[l.logro_id]?.nivel).filter(Boolean)
      let nivelMax = null
      ORDEN.forEach(n => { if (niveles.includes(n)) nivelMax = n })
      setLogrosInfo({ count, nivel: nivelMax ? NIVEL_LABEL[nivelMax] : null })
    }
    fetchLogros()
  }, [user, pathname])

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

  const logrosBadgeLabel = logrosInfo.count > 0
    ? logrosInfo.nivel
      ? `${logrosInfo.nivel} (${logrosInfo.count})`
      : `${logrosInfo.count}`
    : null

  const navItems = [
    { href: '/dashboard',       label: 'Inicio',               icon: Home },
    { href: '/historial',       label: 'Registros Diarios',    icon: BookOpen },
    { href: '/mensajes',        label: 'Mensajes',             icon: MessageCircle, badge: mensajesNoLeidos },
    { href: '/metas',           label: 'Metas',                icon: Target, badge: metasActivas },
    { href: '/progreso',        label: 'Progreso',             icon: TrendingUp },
    { href: '/equipo',          label: 'Red de apoyo',         icon: Users },
    { href: '/reporte-medico',  label: 'Reporte para Médicos', icon: FileText },
    { href: '/invitar',         label: 'Invitar',              icon: UserPlus },
    { href: '/mi-red',          label: 'Mi Red',               icon: Network },
    { href: '/logros',          label: 'Mis Logros',           icon: Trophy, badgeLogros: logrosBadgeLabel },
    { href: '/material',         label: 'Material',             icon: LayoutGrid },
    { href: '/noticias',        label: 'Noticias',             icon: Newspaper },
    { href: '/ayuda',           label: 'Ayuda',                icon: HelpCircle },
  ]

  const displayName  = perfil?.nombre_completo || user?.user_metadata?.nombre_completo || user?.email || ''
  const displayEmail = user?.email || ''
  const rolLabel     = { padre: 'Padre/Madre', maestra_sombra: 'Maestra Sombra', terapeuta: 'Terapeuta' }[perfil?.rol_principal] || 'Usuario'
  const initials     = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // ── Color y urgencia del badge de trial ──────────────────────────────
  const trialUrgente  = enTrial && diasRestantes !== null && diasRestantes <= 7
  const trialModerado = enTrial && diasRestantes !== null && diasRestantes > 7 && diasRestantes <= 15

  const NotifButton = () => {
    if (estado === 'no-soportado' || estado === 'denegado') return null
    const isActiveNotif = estado === 'activo' || estado === 'desactivando'
    return (
      <button
        onClick={isActiveNotif ? desactivar : activar}
        disabled={estado === 'desactivando' || estado === 'solicitando'}
        title={isActiveNotif ? 'Desactivar notificaciones' : 'Activar notificaciones'}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all
          ${isActiveNotif ? 'text-green-600 hover:bg-green-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
          disabled:opacity-50`}
      >
        <Bell className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <span className="truncate">
            {isActiveNotif
              ? estado === 'desactivando' ? 'Desactivando...' : 'Notif. activas'
              : estado === 'solicitando'  ? 'Activando...'    : 'Notificaciones'}
          </span>
        )}
      </button>
    )
  }

  // ── Badge de trial para la sidebar ───────────────────────────────────
  const TrialBadge = ({ mobile = false }) => {
    if (!enTrial) return null

    if (trialVencido) {
      return (
        <Link
          href="/pricing"
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold
                     bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
          {(!collapsed || mobile) && <span className="flex-1 text-left">Trial vencido · Suscríbete</span>}
          {(!collapsed || mobile) && <Zap className="w-3.5 h-3.5 shrink-0" />}
        </Link>
      )
    }

    const colorCls = trialUrgente
      ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
      : trialModerado
      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'

    const dotCls = trialUrgente
      ? 'bg-orange-500 animate-pulse'
      : trialModerado
      ? 'bg-amber-400'
      : 'bg-blue-400'

    return (
      <Link
        href="/pricing"
        title={collapsed && !mobile ? `${diasRestantes} días de prueba restantes` : undefined}
        className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold
                   border transition-all ${colorCls}
                   ${collapsed && !mobile ? 'justify-center' : ''}`}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        {(!collapsed || mobile) && (
          <>
            <span className="flex-1 text-left">
              {diasRestantes === 1
                ? '¡Último día de prueba!'
                : `${diasRestantes} días de prueba`}
            </span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`} />
          </>
        )}
        {/* Modo colapsado: solo número */}
        {collapsed && !mobile && (
          <span className="text-[10px] font-bold leading-none">{diasRestantes}d</span>
        )}
      </Link>
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
          <div className="w-14 h-14">
            <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={56} height={56} className="object-contain" priority />
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
        {navItems.map(({ href, label, icon: Icon, badge, badgeLogros }) => {
          const active    = pathname === href || pathname.startsWith(href + '/')
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
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {showBadge && collapsed && !mobile && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5
                                   bg-red-500 text-white text-[9px] font-bold rounded-full
                                   flex items-center justify-center leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {badgeLogros && collapsed && !mobile && (
                  <span className="absolute -top-1.5 -right-2 h-4 px-1
                                   bg-violet-500 text-white text-[8px] font-bold rounded-full
                                   flex items-center justify-center leading-none whitespace-nowrap">
                    🏆
                  </span>
                )}
              </div>
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
                  {badgeLogros && (
                    <span className={`h-5 px-2 rounded-full text-[10px] font-bold
                                     flex items-center justify-center leading-none shrink-0 whitespace-nowrap
                                     ${active ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                      {badgeLogros}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className={`px-3 py-4 border-t border-slate-100 space-y-1 ${collapsed && !mobile ? 'flex flex-col items-center gap-1' : ''}`}>
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

        {/* ✅ NUEVO: Badge de trial — solo para padres en free trial */}
        {perfil?.rol_principal === 'padre' && (
          <TrialBadge mobile={mobile} />
        )}

        {/* Suscripción Stripe (si ya tiene) */}
        {!enTrial && (!collapsed || mobile) && (
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
        {!enTrial && collapsed && !mobile && (
          <button
            onClick={openPortal}
            title={isActive ? 'Suscripción activa' : 'Sin suscripción activa'}
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
              ${isActive ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </button>
        )}

        {/* Avatar + nombre + email */}
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 mt-2">
            <div className="w-9 h-9 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 ring-2 ring-primary-100">
              {initials || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{displayName || '—'}</p>
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">{displayEmail}</p>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 leading-none
                ${ perfil?.rol_principal === 'padre'          ? 'bg-amber-100 text-amber-700'
                 : perfil?.rol_principal === 'maestra_sombra' ? 'bg-blue-100 text-blue-700'
                 : perfil?.rol_principal === 'terapeuta'      ? 'bg-violet-100 text-violet-700'
                 : 'bg-slate-100 text-slate-500' }`}>
                {rolLabel}
              </span>
            </div>
          </div>
        )}
        {/* Avatar colapsado */}
        {collapsed && !mobile && (
          <div title={`${displayName}\n${displayEmail}`}
            className="w-9 h-9 rounded-full bg-primary-600 text-white text-sm font-bold
                       flex items-center justify-center mx-auto cursor-default
                       ring-2 ring-primary-100">
            {initials || '?'}
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

        {/* ✅ NUEVO: Badge de trial en mobile top bar */}
        {enTrial && perfil?.rol_principal === 'padre' && !trialVencido && (
          <Link
            href="/pricing"
            className={`ml-auto flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-all
              ${trialUrgente
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'bg-blue-100 text-blue-700 border border-blue-200'}`}
          >
            <Clock className="w-3 h-3" />
            {diasRestantes}d gratis
          </Link>
        )}
        {enTrial && trialVencido && perfil?.rol_principal === 'padre' && (
          <Link
            href="/pricing"
            className="ml-auto flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full"
          >
            <Zap className="w-3 h-3" />
            Suscríbete
          </Link>
        )}

        {mensajesNoLeidos > 0 && !enTrial && (
          <Link href="/mensajes" className="ml-auto relative p-2 rounded-xl hover:bg-slate-100 transition-colors group">
            <MessageCircle className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
                            bg-red-500 text-white text-[10px] font-bold flex items-center
                            justify-center leading-none ring-2 ring-white">
              {mensajesNoLeidos > 9 ? '9+' : mensajesNoLeidos}
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            </span>
          </Link>
        )}
        {metasActivas > 0 && !enTrial && (
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
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <NextImage src="/pulsoAzulLogo.png" alt="Pulso Azul" width={32} height={32} className="object-contain" priority />
            <span className="font-bold text-slate-900">Pulso Azul</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent mobile />
      </aside>
    </>
  )
}