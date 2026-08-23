import { describe, expect, it } from 'vitest'
import { normalizeSpelling, normalizeWord, spellingMatches } from '@/lib/normalize'

describe('word normalization', () => {
  it('normalizes case, unicode apostrophes, dashes and spaces', () => {
    expect(normalizeWord('  CAN’T—miss  ')).toBe("can't-miss")
    expect(normalizeSpelling('well — being')).toBe('well-being')
  })

  it('does not penalize case or reasonable punctuation spacing', () => {
    expect(spellingMatches("mother-in-law", ' MOTHER - IN - LAW ')).toBe(true)
    expect(spellingMatches("student's", 'STUDENT’S')).toBe(true)
    expect(spellingMatches('inevitable', 'inevitably')).toBe(false)
  })
})
