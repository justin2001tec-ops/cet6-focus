import { describe, expect, it } from 'vitest'
import { newSerializedCard } from '@/lib/fsrs'
import { getWeakWordSignal, getWeakWordSignals } from '@/lib/weak'
import type { LearningCard, ReviewLogRecord } from '@/types'

function makeCard(overrides: Partial<LearningCard> = {}): LearningCard {
  const fsrsCard = { ...newSerializedCard(new Date('2026-08-22T08:00:00.000Z')), state: 2, stability: 60, reps: 5, lastReview: '2026-08-22T08:00:00.000Z' }
  return { wordId: 'weak-test', due: '2026-08-30T08:00:00.000Z', fsrsCard, starred: false, spellingWrongCount: 0, createdAt: fsrsCard.due, updatedAt: fsrsCard.due, ...overrides }
}

function log(rating: 1 | 3, reviewedAt: string): ReviewLogRecord {
  const fsrsCard = newSerializedCard(new Date(reviewedAt))
  return { wordId: 'weak-test', sessionId: 'session', rating, reviewedAt, before: fsrsCard, after: fsrsCard }
}

describe('weak-word signals', () => {
  const now = new Date('2026-08-22T08:00:00.000Z')

  it('does not make historical Again attempts permanent Weak state', () => {
    const signal = getWeakWordSignal(makeCard(), [log(1, '2026-06-01T08:00:00.000Z'), log(1, '2026-06-02T08:00:00.000Z')], now)
    expect(signal.isWeak).toBe(false)
    expect(signal.recentAgainCount).toBe(0)
  })

  it('marks recent Again, Relearning, spelling and starred signals consistently', () => {
    expect(getWeakWordSignal(makeCard(), [log(1, '2026-08-20T08:00:00.000Z'), log(1, '2026-08-21T08:00:00.000Z')], now).isWeak).toBe(true)
    expect(getWeakWordSignal(makeCard({ fsrsCard: { ...makeCard().fsrsCard, state: 3 } }), [], now).reasons).toContain('relearning')
    expect(getWeakWordSignal(makeCard({ spellingWrongCount: 1, lastSpellingAt: '2026-08-21T08:00:00.000Z' }), [], now).reasons).toContain('spelling')
    expect(getWeakWordSignal(makeCard({ starred: true }), [], now).reasons).toContain('starred')
  })

  it('decays spelling history without erasing the error count', () => {
    const recent = makeCard({ spellingWrongCount: 1, lastSpellingAt: '2026-08-21T08:00:00.000Z' })
    const old = makeCard({ spellingWrongCount: 5, lastSpellingAt: '2026-06-20T08:00:00.000Z' })

    expect(getWeakWordSignal(recent, [], now).isWeak).toBe(true)
    expect(getWeakWordSignal(recent, [], now).spellingSignal).toBeGreaterThan(0)
    expect(old.spellingWrongCount).toBe(5)
    expect(getWeakWordSignal(old, [], now).isWeak).toBe(false)
    expect(getWeakWordSignal(old, [], now).spellingSignal).toBe(0)

    const reentered = { ...old, lastSpellingAt: now.toISOString() }
    expect(getWeakWordSignal(reentered, [], now).isWeak).toBe(true)
  })

  it('keeps the same Weak set for dashboard, mistakes, queue, and stats consumers', () => {
    const cards = [
      makeCard({ wordId: 'recent', spellingWrongCount: 2, lastSpellingAt: '2026-08-21T08:00:00.000Z' }),
      makeCard({ wordId: 'old', spellingWrongCount: 5, lastSpellingAt: '2026-06-20T08:00:00.000Z' }),
    ]
    const signals = getWeakWordSignals(cards, [], now)
    const weakIds = cards.filter((card) => signals.get(card.wordId)?.isWeak).map((card) => card.wordId)
    expect(weakIds).toEqual(['recent'])
    expect(Array.from(signals.values()).filter((signal) => signal.isWeak)).toHaveLength(1)
  })
})
