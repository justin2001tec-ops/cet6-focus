import { forwardRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type PointerEvent, type ReactNode } from 'react'
import { m, type HTMLMotionProps } from 'motion/react'
import { NavLink, type NavLinkProps } from 'react-router-dom'
import { useMotionProfile } from './motion/useMotionProfile'

interface ApplePressableProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  children: ReactNode
}

export const ApplePressable = forwardRef<HTMLButtonElement, ApplePressableProps>(function ApplePressable({ children, className = '', disabled, ...props }, ref) {
  const { profile, pressScale } = useMotionProfile()
  const motionProps = props as unknown as Omit<HTMLMotionProps<'button'>, 'ref' | 'children'>
  return (
    <m.button
      ref={ref}
      {...motionProps}
      disabled={disabled}
      className={`apple-pressable ${className}`}
      data-motion-pressable="true"
      whileTap={profile === 'full' && !disabled ? { scale: pressScale } : undefined}
      transition={profile === 'full' ? { type: 'spring', stiffness: 520, damping: 36, mass: 0.24 } : { duration: 0 }}
      >
      {children}
    </m.button>
  )
})

// NavLink's DOM event props overlap with Motion's animation event names. The
// component still forwards the real router link/ref; this cast only resolves
// that library typing collision at the adapter boundary.
const MotionNavLink = m(NavLink as unknown as React.ComponentType<Record<string, unknown>>)

export type PressableLinkProps = Omit<NavLinkProps, 'className' | 'children' | 'onDrag' | 'onDragStart' | 'onDragEnd'> & {
  className?: string
  children?: ReactNode
}

export const PressableLink = forwardRef<HTMLAnchorElement, PressableLinkProps>(function PressableLink({ children, className = '', ...props }, ref) {
  const { profile, pressScale } = useMotionProfile()
  const [pressed, setPressed] = useState(false)

  const onPointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    setPressed(true)
    props.onPointerDown?.(event)
  }
  const releasePress = (event: PointerEvent<HTMLAnchorElement>) => {
    setPressed(false)
    if (event.type === 'pointerup') props.onPointerUp?.(event)
    if (event.type === 'pointercancel') props.onPointerCancel?.(event)
    if (event.type === 'pointerleave') props.onPointerLeave?.(event)
  }

  return (
    <MotionNavLink
      {...props}
      ref={ref}
      className={`apple-pressable apple-pressable-link ${className}`}
      data-motion-pressable="true"
      data-press-state={pressed ? 'pressed' : 'idle'}
      onPointerDown={onPointerDown}
      onPointerUp={releasePress}
      onPointerCancel={releasePress}
      onPointerLeave={releasePress}
      style={profile === 'full' && pressed ? { transform: `scale(${pressScale})` } : undefined}
    >
      {children}
    </MotionNavLink>
  )
})

export function ReadingSurface({ children, className = '', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section {...props} className={`reading-surface ${className}`}>{children}</section>
}

export function GlassBar({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div {...props} className={`glass-bar ${className}`}>{children}</div>
}

export function GlassControl({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div {...props} className={`glass-control ${className}`}>{children}</div>
}
