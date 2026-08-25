import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState, type CSSProperties } from 'react'
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Headphones,
  Home,
  ListChecks,
  MoreHorizontal,
  Settings2,
  Target,
  Volume2,
} from 'lucide-react'
import { useApp } from '@/app/providers'
import { Notice } from '@/components/ui'
import { getRoutePresentation, isRouteActive } from '@/lib/route-presentation'
import { MotionRoute } from '@/design-system/motion/MotionRoute'
import { ApplePressable } from '@/design-system/components'
import type { Background } from '@/config/backgrounds'
import { useNavigationMotion } from '@/design-system/motion/navigation-motion'

const desktopNav = [
  { to: '/', label: '今日', icon: Home, end: true },
  { to: '/learn', label: '学习', icon: BookOpen },
  { to: '/words', label: '词库', icon: ListChecks },
  { to: '/stats', label: '统计', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings2 },
]

const mobileNav = [
  { to: '/', label: '今日', icon: Home, end: true },
  { to: '/learn', label: '学习', icon: BookOpen },
  { to: '/words', label: '词库', icon: ListChecks },
  { to: '/more', label: '更多', icon: MoreHorizontal },
]

export function AppShell() {
  const { background, notice, clearNotice } = useApp()
  const { markNavigationIntent } = useNavigationMotion()
  const location = useLocation()
  const [keyboardInputFocused, setKeyboardInputFocused] = useState(false)
  const [backgroundLayers, setBackgroundLayers] = useState<Background[]>(background ? [background] : [])
  const isImmersiveHome = location.pathname === '/'
  const isLearningRoute = ['/study', '/review', '/mistakes/study'].includes(location.pathname)

  useEffect(() => {
    let cancelled = false
    if (!background) {
      if (backgroundLayers.length) setBackgroundLayers([])
      return () => { cancelled = true }
    }
    if (backgroundLayers.some((layer) => layer.id === background.id)) return () => { cancelled = true }

    const preload = new Image()
    preload.src = background.avif
    const decode = typeof preload.decode === 'function' ? preload.decode().catch(() => undefined) : Promise.resolve()
    void decode.then(() => {
      if (cancelled) return
      setBackgroundLayers((current) => [...current.filter((layer) => layer.id !== background.id), background].slice(-2))
      window.setTimeout(() => {
        if (!cancelled) setBackgroundLayers((current) => current.filter((layer) => layer.id === background.id))
      }, 460)
    })
    return () => { cancelled = true }
  }, [background, backgroundLayers])

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      setKeyboardInputFocused(event.target instanceof HTMLInputElement && event.target.matches('.dictation-input'))
    }
    const handleFocusOut = () => setKeyboardInputFocused(false)
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  return (
    <div className={`app-frame ${background ? 'app-frame--with-background' : 'app-frame--plain'} ${isImmersiveHome ? 'app-frame--immersive-home' : ''} ${isLearningRoute ? 'app-frame--learning' : ''} ${keyboardInputFocused ? 'app-frame--keyboard-input' : ''}`}>
      <div className="app-background" aria-hidden="true" data-background-layer-count={backgroundLayers.length}>
        {backgroundLayers.map((layer, index) => <div key={layer.id} className="app-background__layer" data-background-id={layer.id} style={{
          '--scene-position': layer.desktopPosition,
          '--scene-mobile-position': layer.mobilePosition,
          '--scene-overlay': String(layer.overlayOpacity),
          opacity: index === backgroundLayers.length - 1 ? 1 : 0,
        } as CSSProperties}>
          <picture><source srcSet={layer.avif} type="image/avif" /><img src={layer.webp} alt="" /></picture>
        </div>)}
      </div>
      {!isImmersiveHome && !isLearningRoute && <aside className="sidebar liquid-glass glass-bar">
        <NavBrand />
        <nav className="sidebar__nav" aria-label="主导航">
          <NavGroup label="Workspace">
            {desktopNav.map((item) => <NavigationLink key={item.to} {...item} />)}
          </NavGroup>
          <div className="sidebar__quick-links">
            <span className="nav-group__label">学习入口</span>
            <NavLink to="/review" className={`nav-item nav-item--sub ${isRouteActive('/review', location.pathname) ? 'is-active' : ''}`}><CheckCircleIcon /><span>复习</span><span className="nav-item__hint">优先</span></NavLink>
            <NavLink to="/dictation" className={`nav-item nav-item--sub ${isRouteActive('/dictation', location.pathname) ? 'is-active' : ''}`}><Headphones size={16} aria-hidden="true" /><span>听写</span></NavLink>
            <NavLink to="/mistakes" className={`nav-item nav-item--sub ${isRouteActive('/mistakes', location.pathname) ? 'is-active' : ''}`}><Target size={16} aria-hidden="true" /><span>薄弱词</span></NavLink>
          </div>
        </nav>
        <div className="sidebar__bottom">
          <div className="sidebar__signature"><span className="status-dot" /> Local-first · UI preview</div>
        </div>
      </aside>}

      <main className="main-content">
        {!isImmersiveHome && !isLearningRoute && <div className="mobile-topbar liquid-glass glass-bar">
          <NavBrand compact />
          <span className="mobile-topbar__title">{getRoutePresentation(location.pathname).title}</span>
          <NavLink to="/settings" className="icon-button" aria-label="打开设置"><Settings2 size={19} /></NavLink>
        </div>}
        {notice && <Notice message={notice} onClose={clearNotice} />}
        <MotionRoute><Outlet /></MotionRoute>
      </main>

      {!isImmersiveHome && !isLearningRoute && <nav className="mobile-nav liquid-glass glass-bar" style={keyboardInputFocused ? { opacity: 0, pointerEvents: 'none', transform: 'translateY(calc(100% + 24px))' } : undefined} aria-label="移动端主导航">
        {mobileNav.map((item) => {
          const Icon = item.icon
          const active = isRouteActive(item.to, location.pathname)
          return <NavLink key={item.to} to={item.to} end={item.end} onClick={(event) => markNavigationClick(event, markNavigationIntent)} className={`mobile-nav__item ${active ? 'is-active' : ''}`}>
            <span className="mobile-nav__icon"><Icon size={19} /></span><span>{item.label}</span>
          </NavLink>
        })}
      </nav>}
      {isImmersiveHome && <MinimalHomeNav hidden={keyboardInputFocused} />}
    </div>
  )
}

function MinimalHomeNav({ hidden }: { hidden: boolean }) {
  const location = useLocation()
  const { markNavigationIntent } = useNavigationMotion()
  const items = [
    { to: '/', label: '首页', icon: Home, end: true },
    { to: '/words', label: '词库', icon: ListChecks },
    { to: '/more', label: '更多', icon: MoreHorizontal },
  ]
  return (
    <nav className="immersive-home__bottom-nav" style={hidden ? { opacity: 0, pointerEvents: 'none', transform: 'translateY(calc(100% + 24px))' } : undefined} aria-label="首页主导航">
      {items.map((item) => {
        const Icon = item.icon
        const active = isRouteActive(item.to, location.pathname)
        return <NavLink key={item.to} to={item.to} end={item.end} onClick={(event) => markNavigationClick(event, markNavigationIntent)} className={`immersive-home__nav-item ${active ? 'is-active' : ''}`} aria-label={item.label}>
          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">{item.label}</span>
        </NavLink>
      })}
    </nav>
  )
}

function NavBrand({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink to="/" className={`nav-brand ${compact ? 'nav-brand--compact' : ''}`}>
      <span className="brand-mark">C6</span>
      <span className="nav-brand__copy">
        <strong>CET6 Focus</strong>
        <small>quiet progress</small>
      </span>
    </NavLink>
  )
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="nav-group"><div className="nav-group__label">{label}</div>{children}</div>
}

function NavigationLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Home; end?: boolean }) {
  const location = useLocation()
  const { markNavigationIntent } = useNavigationMotion()
  const active = isRouteActive(to, location.pathname)
  return (
    <NavLink to={to} end={end} onClick={(event) => markNavigationClick(event, markNavigationIntent)} className={`nav-item ${active ? 'is-active' : ''}`}>
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

function CheckCircleIcon() {
  return <CheckCircle2 size={16} aria-hidden="true" />
}

function markNavigationClick(event: React.MouseEvent<HTMLAnchorElement>, mark: () => number) {
  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) mark()
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: React.ReactNode; description?: string; action?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </header>
  )
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}

export function InlineLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <NavLink className="inline-link" to={to}>{children}<ChevronRight size={14} /></NavLink>
}

export function AudioButton({ onClick, label = '播放发音' }: { onClick: () => void; label?: string }) {
  return <ApplePressable className="audio-button glass-control" type="button" onClick={onClick} aria-label={label}><Volume2 size={16} /><span>{label}</span></ApplePressable>
}
