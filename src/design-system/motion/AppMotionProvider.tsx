import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LayoutGroup, LazyMotion, MotionConfig } from 'motion/react'
import { domMax } from './motion-features'
import { MotionProfileContext } from './useMotionProfile'
import { useInputModality } from './useInputModality'
import type { MotionProfile } from './motion-presets'
import { useApp } from '@/app/providers'

function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export function AppMotionProvider({ children }: { children: ReactNode }) {
  const { settings } = useApp()
  const inputModality = useInputModality()
  const reducedBySystem = useSystemReducedMotion()
  const reducedByUser = settings.reducedMotion
  const profile: MotionProfile = reducedByUser || reducedBySystem ? 'reduced' : 'full'
  const effectiveReducedMotion = reducedByUser || reducedBySystem
  const value = useMemo(() => ({ ...inputModality, profile, reducedByUser, reducedBySystem }), [inputModality, profile, reducedBySystem, reducedByUser])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.motionProfile = profile
    root.dataset.motionConfigReduced = String(effectiveReducedMotion)
    root.dataset.inputModality = inputModality.modality
    root.dataset.pointerType = inputModality.pointerType
  }, [effectiveReducedMotion, inputModality.modality, inputModality.pointerType, profile])

  return (
    <MotionProfileContext.Provider value={value}>
      <LazyMotion features={domMax} strict>
        <MotionConfig reducedMotion={reducedByUser ? 'always' : 'user'}>
          <LayoutGroup id="cet6-focus-system-motion">
            {children}
          </LayoutGroup>
        </MotionConfig>
      </LazyMotion>
    </MotionProfileContext.Provider>
  )
}
