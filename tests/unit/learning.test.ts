import { describe, expect, it } from 'vitest'
import { nextLearningState, recognitionToRating } from '@/features/study/learning'
import type { Word } from '@/types'

function word(patch: Partial<Word> = {}): Word {
  return { id: 'fixture', word: 'abandon', meaningZh: ['放弃'], source: 'test', ...patch }
}

describe('v1.3 learning presentation adapter', () => {
  it('maps natural recognition choices to frozen FSRS ratings', () => {
    expect(recognitionToRating).toEqual({ unknown: 1, fuzzy: 2, known: 3, mastered: 4 })
  })

  it('uses context only when the current word has a real example', () => {
    expect(nextLearningState('unknown', word())).toBe('meaning')
    expect(nextLearningState('fuzzy', word({ examples: [{ en: 'We abandon the plan.' }] }))).toBe('context')
    expect(nextLearningState('known', word({ examples: [{ en: 'We abandon the plan.' }] }))).toBe('meaning')
  })
})
