import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, type ButtonHTMLAttributes, type RefObject } from 'react'
import { GlassSurface } from '@/design-system/glass/GlassSurface'

interface OverflowGlassButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'onPointerMove' | 'onPointerEnter' | 'onPointerLeave' | 'onPointerDown' | 'onPointerUp' | 'onPointerCancel'> {
  anchorRef: RefObject<HTMLButtonElement | null>
  open: boolean
  className?: string
}

export function OverflowGlassButton({ anchorRef, open, className = '', type = 'button', ...props }: OverflowGlassButtonProps) {
  return (
    <GlassSurface
      {...props}
      ref={anchorRef as unknown as RefObject<HTMLElement>}
      as="button"
      type={type}
      variant="regular"
      interactive
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls="study-more-popover"
      className={`overflow-glass-button ${open ? 'is-open' : ''} ${className}`}
    >
      <MoreHorizontal size={17} strokeWidth={1.8} aria-hidden="true" />
      <span>更多</span>
    </GlassSurface>
  )
}

export function StudyOverflowMenu({ open, anchorRef, onClose, onExpand }: { open: boolean; anchorRef: RefObject<HTMLButtonElement | null>; onClose: () => void; onExpand: () => void }) {
  const menuRef = useRef<HTMLElement | null>(null)
  const itemRef = useRef<HTMLButtonElement | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    const menu = menuRef.current
    if (!anchor || !menu) return
    const source = anchor.getBoundingClientRect()
    const destination = menu.getBoundingClientRect()
    const scaleX = Math.max(0.72, Math.min(1, source.width / Math.max(1, destination.width)))
    const scaleY = Math.max(0.72, Math.min(1, source.height / Math.max(1, destination.height)))
    menu.style.setProperty('--morph-x', `${source.left + source.width / 2 - (destination.left + destination.width / 2)}px`)
    menu.style.setProperty('--morph-y', `${source.top + source.height / 2 - (destination.top + destination.height / 2)}px`)
    menu.style.setProperty('--morph-scale-x', String(scaleX))
    menu.style.setProperty('--morph-scale-y', String(scaleY))
    menu.dataset.popoverPhase = 'materializing'
    const frame = window.requestAnimationFrame(() => { if (menuRef.current) menuRef.current.dataset.popoverPhase = 'settled' })
    return () => window.cancelAnimationFrame(frame)
  }, [anchorRef, open])

  useEffect(() => {
    if (open) itemRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <GlassSurface
      ref={menuRef}
      id="study-more-popover"
      className="study-overflow-menu"
      variant="expanded"
      role="menu"
      aria-label="更多学习操作"
      data-more-morph="flip"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        onClose()
        anchorRef.current?.focus()
      }}
    >
      <p className="study-overflow-menu__eyebrow">继续理解</p>
      <button ref={itemRef} type="button" role="menuitem" className="study-overflow-menu__item" onClick={onExpand}>
        <span><strong>扩展理解</strong><small>更多释义、例句与词形</small></span>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </GlassSurface>
  )
}
