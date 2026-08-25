import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface ScopeReport { uiMotionFrozen: boolean; frozenViolations: string[]; baseline: string }

const root = resolve(process.cwd())
const report = JSON.parse(readFileSync(resolve(root, 'audit/v1.3-context-human-quality/scope-check.json'), 'utf8')) as ScopeReport

describe('Round 4 UI and Motion freeze', () => {
  it('records no changed UI, Motion, or business-logic files against the frozen baseline', () => {
    expect(report.baseline).toBe('6bd6fb4a208bcfed07cafff06645b36fc4dc59a9')
    expect(report.uiMotionFrozen).toBe(true)
    expect(report.frozenViolations).toEqual([])
  })
})
