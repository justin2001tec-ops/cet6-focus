import { Outlet, NavLink, useLocation } from 'react-router-dom'
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

const mainNav = [
  { to: '/', label: '今日', icon: Home, end: true },
  { to: '/study', label: '学习', icon: BookOpen },
  { to: '/review', label: '复习', icon: CheckCircle2 },
  { to: '/dictation', label: '听写', icon: Headphones },
]

const libraryNav = [
  { to: '/words', label: '词库', icon: ListChecks },
  { to: '/mistakes', label: '薄弱词', icon: Target },
  { to: '/stats', label: '统计', icon: BarChart3 },
]

export function AppShell() {
  const { background, notice, clearNotice } = useApp()
  const location = useLocation()
  const backgroundStyle = background ? { objectPosition: background.objectPosition ?? 'center' } : undefined

  return (
    <div className={`app-frame ${background ? 'app-frame--with-background' : 'app-frame--plain'}`}>
      <div className="app-background" aria-hidden="true">{background && <picture style={backgroundStyle}><source srcSet={background.avif} type="image/avif" /><img src={background.webp} alt="" style={{ objectPosition: background.objectPosition ?? 'center' }} /></picture>}</div>
      <aside className="sidebar">
        <NavBrand />
        <nav className="sidebar__nav" aria-label="主导航">
          <NavGroup label="学习">
            {mainNav.map((item) => <NavigationLink key={item.to} {...item} />)}
          </NavGroup>
          <NavGroup label="整理">
            {libraryNav.map((item) => <NavigationLink key={item.to} {...item} />)}
          </NavGroup>
        </nav>
        <div className="sidebar__bottom">
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
            <Settings2 size={17} aria-hidden="true" />
            <span>设置</span>
          </NavLink>
          <div className="sidebar__signature"><span className="status-dot" /> Local-first · v1</div>
        </div>
      </aside>

      <main className="main-content">
        <div className="mobile-topbar">
          <NavBrand compact />
          <NavLink to="/settings" className="icon-button" aria-label="打开设置"><Settings2 size={19} /></NavLink>
        </div>
        {notice && <Notice message={notice} onClose={clearNotice} />}
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="移动端主导航">
        {[...mainNav.slice(0, 3), { to: '/more', label: '更多', icon: MoreHorizontal }].map((item) => {
          const Icon = item.icon
          const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
          return item.to === '/more' ? (
            <NavLink key={item.to} to="/settings" className={`mobile-nav__item ${isActive ? 'is-active' : ''}`}>
              <Icon size={19} /><span>{item.label}</span>
            </NavLink>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive: routeActive }) => `mobile-nav__item ${routeActive ? 'is-active' : ''}`}>
              <Icon size={19} /><span>{item.label}</span>
            </NavLink>
          )
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
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
      {label === '复习' && <span className="nav-item__hint">优先</span>}
    </NavLink>
  )
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
