import { createContext, useContext } from 'react'
import type { InputModalityState } from './useInputModality'
import type { MotionProfile } from './motion-presets'

export interface MotionProfileState extends InputModalityState {
  profile: MotionProfile
  reducedByUser: boolean
  reducedBySystem: boolean
}

export const MotionProfileContext = createContext<MotionProfileState | null>(null)

export function useMotionProfile(): MotionProfileState {
  const value = useContext(MotionProfileContext)
  if (!value) throw new Error('useMotionProfile must be used inside AppMotionProvider')
  return value
}
