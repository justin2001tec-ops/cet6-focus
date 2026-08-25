import type { Variants } from 'motion/react'

export type MotionProfile = 'full' | 'reduced'

export const systemMotionTokens = {
  instant: 0,
  fast: 0.14,
  standard: 0.24,
  deliberate: 0.32,
  sheet: 0.28,
  pressScaleFine: 0.975,
  pressScaleCoarse: 0.96,
} as const

export const routeMotionPresets: Record<'default' | 'learning' | 'entity' | 'modal', Record<MotionProfile, Variants>> = {
  default: {
    full: {
      initial: { opacity: 0, y: 8 },
      enter: { opacity: 1, y: 0, transition: { duration: systemMotionTokens.standard, ease: [0.2, 0.8, 0.2, 1] } },
      exit: { opacity: 0, y: -4, transition: { duration: systemMotionTokens.fast, ease: [0.4, 0, 1, 1] } },
    },
    reduced: {
      initial: { opacity: 1, y: 0 },
      enter: { opacity: 1, y: 0, transition: { duration: 0 } },
      exit: { opacity: 1, y: 0, transition: { duration: 0 } },
    },
  },
  learning: {
    full: {
      initial: { opacity: 0 },
      enter: { opacity: 1, transition: { duration: systemMotionTokens.fast, ease: 'linear' } },
      exit: { opacity: 1, transition: { duration: 0 } },
    },
    reduced: {
      initial: { opacity: 1 },
      enter: { opacity: 1, transition: { duration: 0 } },
      exit: { opacity: 1, transition: { duration: 0 } },
    },
  },
  entity: {
    full: {
      initial: { opacity: 0, scale: 0.99 },
      enter: { opacity: 1, scale: 1, transition: { duration: systemMotionTokens.standard, ease: [0.2, 0.8, 0.2, 1] } },
      exit: { opacity: 0, scale: 0.995, transition: { duration: systemMotionTokens.fast, ease: [0.4, 0, 1, 1] } },
    },
    reduced: {
      initial: { opacity: 1, scale: 1 },
      enter: { opacity: 1, scale: 1, transition: { duration: 0 } },
      exit: { opacity: 1, scale: 1, transition: { duration: 0 } },
    },
  },
  modal: {
    full: {
      initial: { opacity: 0, y: 16 },
      enter: { opacity: 1, y: 0, transition: { duration: systemMotionTokens.sheet, ease: [0.16, 1, 0.3, 1] } },
      exit: { opacity: 0, y: 24, transition: { duration: systemMotionTokens.fast, ease: [0.4, 0, 1, 1] } },
    },
    reduced: {
      initial: { opacity: 1, y: 0 },
      enter: { opacity: 1, y: 0, transition: { duration: 0 } },
      exit: { opacity: 1, y: 0, transition: { duration: 0 } },
    },
  },
}

export function routeMotionKind(pathname: string): keyof typeof routeMotionPresets {
  if (['/study', '/review', '/mistakes/study'].includes(pathname)) return 'learning'
  if (pathname.startsWith('/word/') || pathname.startsWith('/words/')) return 'entity'
  return 'default'
}
