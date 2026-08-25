import { m } from 'motion/react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { routeMotionKind, routeMotionPresets } from './motion-presets'
import { useMotionProfile } from './useMotionProfile'
import { useNavigationMotion } from './navigation-motion'

export function MotionRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { profile } = useMotionProfile()
  const { intentId } = useNavigationMotion()
  const kind = routeMotionKind(location.pathname)
  const variants = routeMotionPresets[kind][profile]

  return (
    <m.div
      key={`${location.pathname}${location.search}`}
      className="motion-route"
      data-motion-route={kind}
      data-motion-intent-id={intentId || undefined}
      initial="initial"
      animate="enter"
      variants={variants}
    >
      {children}
    </m.div>
  )
}

export function SharedElement({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  const { profile } = useMotionProfile()
  const [layoutPhase, setLayoutPhase] = useState<'idle' | 'active' | 'complete'>('idle')
  const sharedLayoutEnabled = profile === 'full'
  return (
    <m.span
      layoutId={sharedLayoutEnabled ? id : undefined}
      className={`shared-element ${className}`}
      data-shared-id={id}
      data-shared-layout={sharedLayoutEnabled ? 'enabled' : 'reduced'}
      data-motion-phase={layoutPhase}
      onLayoutAnimationStart={() => setLayoutPhase('active')}
      onLayoutAnimationComplete={() => setLayoutPhase('complete')}
    >
      {children}
    </m.span>
  )
}
