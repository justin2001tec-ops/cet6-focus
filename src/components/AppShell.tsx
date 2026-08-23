import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
  const location = useLocation()
  const [keyboardInputFocused, setKeyboardInputFocused] = useState(false)
  const backgroundStyle = background ? { objectPosition: background.objectPosition ?? 'center' } : undefined

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
    <div className={`app-frame ${background ? 'app-frame--with-background' : 'app-frame--plain'} ${keyboardInputFocused ? 'app-frame--keyboard-input' : ''}`}>
      <div className="app-background" aria-hidden="true">{background && <picture style={backgroundStyle}><source srcSet={background.avif} type="image/avif" /><img src={background.webp} alt="" style={{ objectPosition: background.objectPosition ?? 'center' }} /></picture>}</div>
      <aside className="sidebar liquid-glass">
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
      </aside>

      <main className="main-content">
        <div className="mobile-topbar liquid-glass">
          <NavBrand compact />
          <span className="mobile-topbar__title">{pageLabel(location.pathname)}</span>
          <NavLink to="/settings" className="icon-button" aria-label="打开设置"><Settings2 size={19} /></NavLink>
        </div>
        {notice && <Notice message={notice} onClose={clearNotice} />}
        <Outlet />
      </main>

      <nav className="mobile-nav liquid-glass" style={keyboardInputFocused ? { opacity: 0, pointerEvents: 'none', transform: 'translateY(calc(100% + 24px))' } : undefined} aria-label="移动端主导航">
        {mobileNav.map((item) => {
          const Icon = item.icon
          const active = isRouteActive(item.to, location.pathname)
          return <NavLink key={item.to} to={item.to} end={item.end} className={`mobile-nav__item ${active ? 'is-active' : ''}`}>
            <span className="mobile-nav__icon"><Icon size={19} /></span><span>{item.label}</span>
          </NavLink>
        })}
      </nav>
    </div>
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
  const active = isRouteActive(to, location.pathname)
  return (
    <NavLink to={to} end={end} className={`nav-item ${active ? 'is-active' : ''}`}>
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

function CheckCircleIcon() {
  return <CheckCircle2 size={16} aria-hidden="true" />
}

function isRouteActive(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/'
  if (to === '/learn') return ['/learn', '/study', '/review', '/dictation', '/mistakes', '/mistakes/study'].some((path) => pathname === path || pathname.startsWith(`${path}/`))
  if (to === '/more') return ['/more', '/stats', '/settings'].some((path) => pathname === path || pathname.startsWith(`${path}/`))
  return pathname === to || pathname.startsWith(`${to}/`)
}

function pageLabel(pathname: string): string {
  if (pathname === '/') return '今日'
  if (pathname === '/words') return '词库'
  if (pathname === '/stats') return '统计'
  if (pathname === '/settings') return '设置'
  if (pathname === '/dictation') return '听写'
  if (pathname === '/review') return '复习'
  return '学习'
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
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
  return <button className="audio-button" type="button" onClick={onClick} aria-label={label}><Volume2 size={16} /><span>{label}</span></button>
}
