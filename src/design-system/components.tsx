import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import { m, type HTMLMotionProps } from 'motion/react'
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
      transition={{ duration: profile === 'full' ? 0.12 : 0 }}
    >
      {children}
    </m.button>
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
