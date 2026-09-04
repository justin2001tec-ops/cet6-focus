import { forwardRef, useEffect, useRef, type ElementType, type HTMLAttributes, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { GlassVariant } from './glassTokens'

type GlassElement = 'div' | 'span' | 'button'

export interface GlassSurfaceProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children' | 'onPointerMove' | 'onPointerEnter' | 'onPointerLeave' | 'onPointerDown' | 'onPointerUp' | 'onPointerCancel'> {
  as?: GlassElement
  variant?: GlassVariant
  interactive?: boolean
  className?: string
  children?: ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onPointerMove?: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerEnter?: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerLeave?: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerDown?: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerUp?: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel?: (event: ReactPointerEvent<HTMLElement>) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const GlassSurface = forwardRef<HTMLElement, GlassSurfaceProps>(function GlassSurface({
  as = 'div',
  variant = 'clear',
  interactive = false,
  className = '',
  children,
  type,
  disabled,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...props
}, forwardedRef) {
  const nodeRef = useRef<HTMLElement | null>(null)
  const lightFrameRef = useRef<number | null>(null)
  const pendingLightRef = useRef<[string, string]>(['50%', '50%'])

  useEffect(() => () => {
    if (lightFrameRef.current !== null) window.cancelAnimationFrame(lightFrameRef.current)
  }, [])

  function setNode(node: HTMLElement | null) {
    nodeRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  function motionAvailable(): boolean {
    return !document.documentElement.dataset.reducedMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function scheduleLight(x: string, y: string) {
    const node = nodeRef.current
    if (!node || !interactive || !motionAvailable()) return
    pendingLightRef.current = [x, y]
    if (lightFrameRef.current !== null) return
    lightFrameRef.current = window.requestAnimationFrame(() => {
      const [nextX, nextY] = pendingLightRef.current
      node.style.setProperty('--glass-light-x', nextX)
      node.style.setProperty('--glass-light-y', nextY)
      lightFrameRef.current = null
    })
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (interactive) {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100, 0, 100)
      const y = clamp(((event.clientY - rect.top) / Math.max(1, rect.height)) * 100, 0, 100)
      scheduleLight(`${x.toFixed(2)}%`, `${y.toFixed(2)}%`)
      event.currentTarget.dataset.glassPointer = 'active'
    }
    onPointerMove?.(event)
  }

  function handlePointerEnter(event: ReactPointerEvent<HTMLElement>) {
    if (interactive) event.currentTarget.dataset.glassPointer = 'active'
    onPointerEnter?.(event)
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLElement>) {
    if (interactive) {
      event.currentTarget.dataset.glassPointer = 'rest'
      scheduleLight('50%', '50%')
      event.currentTarget.dataset.pressState = 'idle'
    }
    onPointerLeave?.(event)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (interactive && !disabled) event.currentTarget.dataset.pressState = 'pressed'
    onPointerDown?.(event)
  }

  function releasePress(event: ReactPointerEvent<HTMLElement>, callback?: (event: ReactPointerEvent<HTMLElement>) => void) {
    if (interactive) event.currentTarget.dataset.pressState = 'idle'
    callback?.(event)
  }

  const Element = as as ElementType
  return (
    <Element
      {...props}
      ref={setNode}
      type={as === 'button' ? type ?? 'button' : undefined}
      disabled={as === 'button' ? disabled : undefined}
      className={`glass-surface glass-surface--${variant} ${className}`}
      data-glass-variant={variant}
      data-glass-interactive={interactive ? 'true' : 'false'}
      data-press-state="idle"
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={(event: ReactPointerEvent<HTMLElement>) => releasePress(event, onPointerUp)}
      onPointerCancel={(event: ReactPointerEvent<HTMLElement>) => releasePress(event, onPointerCancel)}
    >
      {children}
    </Element>
  )
})
