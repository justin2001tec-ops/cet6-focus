import { AlertCircle, LoaderCircle } from 'lucide-react'

export function BootScreen() {
  return (
    <main className="boot-screen" aria-live="polite">
      <div className="brand-mark brand-mark--large">C6</div>
      <LoaderCircle className="spin" size={20} aria-hidden="true" />
      <p>正在准备你的本地词库…</p>
    </main>
  )
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="boot-screen" role="alert">
      <div className="state-icon state-icon--danger"><AlertCircle size={22} /></div>
      <h1>本地学习空间暂时无法打开</h1>
      <p>{message}</p>
      <p className="muted">请确认浏览器允许 IndexedDB，并尝试刷新页面。</p>
    </main>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state__line" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
