import { getSpellingWeakSignal } from '@/lib/weak'
import type { LearningCard } from '@/types'

/** Deterministic queue rotation: recent spelling weakness, never dictated, oldest, stable word id. */
export function sortDictationCandidates(cards: LearningCard[], now = new Date()): LearningCard[] {
  return [...cards].sort((a, b) => {
    const spellingDelta = getSpellingWeakSignal(b, now) - getSpellingWeakSignal(a, now)
    if (spellingDelta !== 0) return spellingDelta

    const aLast = a.lastDictationAt ? Date.parse(a.lastDictationAt) : Number.NEGATIVE_INFINITY
    const bLast = b.lastDictationAt ? Date.parse(b.lastDictationAt) : Number.NEGATIVE_INFINITY
    if (aLast !== bLast) return aLast - bLast
    return a.wordId.localeCompare(b.wordId)
  })
}
