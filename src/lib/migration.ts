import { newSerializedCard } from '@/lib/fsrs'
import type { LearningCard, Word } from '@/types'

export interface VocabularyReconciliation {
  words: Word[]
  cards: LearningCard[]
  activeWordIds: Set<string>
  addedWordIds: string[]
  archivedWordIds: string[]
}

/**
 * Reconciles static vocabulary with learning data without deleting user state.
 * Existing cards are returned by reference so callers can verify that no FSRS
 * or personal fields were rewritten during a vocabulary upgrade.
 */
export function reconcileVocabulary(
  existingWords: Word[],
  existingCards: LearningCard[],
  nextWords: Word[],
  now = new Date(),
): VocabularyReconciliation {
  const nextById = new Map(nextWords.map((word) => [word.id, { ...word, archived: false }]))
  const cardById = new Map(existingCards.map((card) => [card.wordId, card]))
  const words: Word[] = [...nextById.values()]
  const archivedWordIds: string[] = []

  for (const word of existingWords) {
    if (nextById.has(word.id)) continue
    words.push({ ...word, archived: true })
    archivedWordIds.push(word.id)
  }

  const addedWordIds: string[] = []
  const cards = [...existingCards]
  for (const word of nextWords) {
    if (cardById.has(word.id)) continue
    const fsrsCard = newSerializedCard(now)
    const card = {
      wordId: word.id,
      due: fsrsCard.due,
      fsrsCard,
      starred: false,
      spellingWrongCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    cards.push(card)
    addedWordIds.push(word.id)
  }

  return {
    words,
    cards,
    activeWordIds: new Set(nextWords.map((word) => word.id)),
    addedWordIds,
    archivedWordIds,
  }
}

export function isActiveWord(word: Word | undefined): boolean {
  return Boolean(word && !word.archived)
}
