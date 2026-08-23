import { describe, expect, it } from 'vitest'
import { chooseBackground, backgrounds } from '@/config/backgrounds'
import { examPlan } from '@/lib/planning'
import { defaultSettings } from '@/lib/fsrs'

describe('planning helpers', () => {
  it('suggests a daily pace for an exam date', () => {
    const settings = { ...defaultSettings(), examDate: '2026-09-21', dailyNewWords: 30 }
    const plan = examPlan(settings, 2219, new Date('2026-08-22T08:00:00'))
    expect(plan.days).toBe(30)
    expect(plan.suggestedDaily).toBe(74)
    expect(plan.projectedPercent).toBe(41)
  })

  it('avoids choosing the previous background consecutively', () => {
    const next = chooseBackground('study-01')
    expect(next.id).not.toBe('study-01')
    expect(backgrounds.length).toBeGreaterThanOrEqual(10)
    expect(backgrounds.every((background) => background.source && background.author && background.license)).toBe(true)
  })
})
