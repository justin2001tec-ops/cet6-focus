import { describe, expect, it } from 'vitest'
import { newSerializedCard } from '@/lib/fsrs'
import { reconcileVocabulary } from '@/lib/migration'
import type { LearningCard, Word } from '@/types'

function word(id: string, meaning: string): Word {
  return { id, word: id, meaningZh: [meaning], source: 'test' }
}

function card(wordId: string, overrides: Partial<LearningCard> = {}): LearningCard {
  const fsrsCard = newSerializedCard(new Date('2026-08-22T08:00:00.000Z'))
  return { wordId, due: fsrsCard.due, fsrsCard, starred: false, spellingWrongCount: 0, createdAt: fsrsCard.due, updatedAt: fsrsCard.due, ...overrides }
}

describe('vocabulary reconciliation', () => {
  it('keeps existing learning state, updates static Word content, archives removals, and creates only new cards', () => {
    const existingA = card('a', { starred: true, personalNote: 'keep this', spellingWrongCount: 4, fsrsCard: { ...newSerializedCard(), state: 2, reps: 7, stability: 22, difficulty: 4.5 } })
    const existingB = card('b', { fsrsCard: { ...newSerializedCard(), state: 1, reps: 2 } })
    const result = reconcileVocabulary([word('a', 'old'), word('b', 'same'), word('c', 'removed')], [existingA, existingB], [word('a', 'updated'), word('b', 'same'), word('d', 'new')], new Date('2026-08-22T08:00:00.000Z'))

    expect(result.words.find((item) => item.id === 'a')?.meaningZh).toEqual(['updated'])
    expect(result.words.find((item) => item.id === 'c')?.archived).toBe(true)
    expect(result.activeWordIds.has('c')).toBe(false)
    expect(result.addedWordIds).toEqual(['d'])
    expect(result.archivedWordIds).toEqual(['c'])
    expect(result.cards.find((item) => item.wordId === 'a')).toBe(existingA)
    expect(result.cards.find((item) => item.wordId === 'a')).toMatchObject({ starred: true, personalNote: 'keep this', spellingWrongCount: 4 })
    expect(result.cards.find((item) => item.wordId === 'a')?.fsrsCard).toMatchObject({ state: 2, reps: 7, stability: 22, difficulty: 4.5 })
    expect(result.cards.find((item) => item.wordId === 'd')?.fsrsCard.state).toBe(0)
    expect(result.cards).toHaveLength(3)
  })

  it('repairs a card-count mismatch without clearing existing or orphan cards', () => {
    const existing = card('a', { starred: true, personalNote: 'preserve' })
    const orphan = card('old-orphan', { spellingWrongCount: 2 })
    const result = reconcileVocabulary([word('a', 'same')], [existing, orphan], [word('a', 'same'), word('b', 'new')])
    expect(result.cards).toEqual([existing, orphan, expect.objectContaining({ wordId: 'b' })])
    expect(result.cards.find((item) => item.wordId === 'old-orphan')).toBe(orphan)
  })
})
