import type { ReactNode } from 'react'

export function BottomActionDock({ children, className = '', sticky = false }: { children: ReactNode; className?: string; sticky?: boolean }) {
  return (
    <div className={`learning-stage-actions bottom-action-dock ${sticky ? 'bottom-action-dock--sticky' : ''} ${className}`} data-functional-layer="bottom-actions" data-scroll-edge="soft">
      <span className="bottom-action-dock__edge" aria-hidden="true" />
      <div className="bottom-action-dock__actions">{children}</div>
    </div>
  )
}
