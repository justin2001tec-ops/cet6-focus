import { describe, expect, it } from 'vitest'
import { newSerializedCard } from '@/lib/fsrs'
import { sortDictationCandidates } from '@/lib/dictation'
import type { LearningCard } from '@/types'

const now = new Date('2026-08-22T08:00:00.000Z')

function card(wordId: string, overrides: Partial<LearningCard> = {}): LearningCard {
  const fsrsCard = { ...newSerializedCard(now), state: 2, reps: 3, stability: 20, lastReview: '2026-08-20T08:00:00.000Z' }
  return { wordId, due: fsrsCard.due, fsrsCard, starred: false, spellingWrongCount: 0, createdAt: fsrsCard.due, updatedAt: fsrsCard.due, ...overrides }
}

describe('dictation rotation', () => {
  it('puts never-dictated cards before recently dictated cards with stable ties', () => {
    const result = sortDictationCandidates([
      card('recent', { lastDictationAt: '2026-08-22T07:59:00.000Z' }),
      card('never'),
      card('older', { lastDictationAt: '2026-08-20T08:00:00.000Z' }),
    ], now)

    expect(result.map((item) => item.wordId)).toEqual(['never', 'older', 'recent'])
  })

  it('lets a recent spelling-weak card outrank dictation recency', () => {
    const result = sortDictationCandidates([
      card('recent-normal', { lastDictationAt: '2026-08-20T08:00:00.000Z' }),
      card('spelling-weak', { lastDictationAt: '2026-08-22T07:59:00.000Z', spellingWrongCount: 2, lastSpellingAt: '2026-08-22T07:58:00.000Z' }),
      card('never'),
    ], now)

    expect(result[0].wordId).toBe('spelling-weak')
    expect(result[1].wordId).toBe('never')
  })

  it('does not treat an old spelling count as a current dictation weakness', () => {
    const result = sortDictationCandidates([
      card('old-error', { spellingWrongCount: 5, lastSpellingAt: '2026-06-20T08:00:00.000Z' }),
      card('never'),
    ], now)

    expect(result.map((item) => item.wordId)).toEqual(['never', 'old-error'])
  })
})
