import { retrievability } from '@/lib/fsrs'
import type { LearningCard, ReviewLogRecord } from '@/types'

export const RECENT_WINDOW_DAYS = 30
const DAY_MS = 86_400_000

export interface WeakWordSignal {
  isWeak: boolean
  score: number
  againCount: number
  recentAgainCount: number
  recentReviewCount: number
  recentAgainRate: number
  spellingSignal: number
  reasons: string[]
  lastError?: string
}

/** Recent spelling errors decay out of the current Weak queue while history remains on the card. */
export function getSpellingWeakSignal(card: LearningCard, now = new Date()): number {
  if (card.spellingWrongCount <= 0 || !card.lastSpellingAt) return 0
  const timestamp = Date.parse(card.lastSpellingAt)
  if (!Number.isFinite(timestamp)) return 0
  const ageMs = Math.max(0, now.getTime() - timestamp)
  return Math.max(0, 1 - ageMs / (RECENT_WINDOW_DAYS * DAY_MS))
}

export function getWeakWordSignal(card: LearningCard, logs: ReviewLogRecord[], now = new Date()): WeakWordSignal {
  const cutoff = now.getTime() - RECENT_WINDOW_DAYS * DAY_MS
  const wordLogs = logs
    .filter((log) => log.wordId === card.wordId)
    .sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime())
  const recentLogs = wordLogs.filter((log) => new Date(log.reviewedAt).getTime() >= cutoff)
  const recentAgainCount = recentLogs.filter((log) => log.rating === 1).length
  const againCount = wordLogs.filter((log) => log.rating === 1).length
  const recentAgainRate = recentLogs.length ? recentAgainCount / recentLogs.length : 0
  const recentAgainSignal = recentAgainCount >= 2 || (recentLogs.length >= 2 && recentAgainRate >= 0.5)
  const lowRetrievability = card.fsrsCard.state !== 0 && retrievability(card.fsrsCard, now) < 0.7
  const spellingSignal = getSpellingWeakSignal(card, now)
  const reasons: string[] = []

  if (card.starred) reasons.push('starred')
  if (spellingSignal) reasons.push('spelling')
  if (card.fsrsCard.state === 3) reasons.push('relearning')
  if (recentAgainSignal) reasons.push('recent-again')
  if (lowRetrievability) reasons.push('low-retrievability')

  const score = (card.starred ? 100 : 0)
    + card.spellingWrongCount * 12 * spellingSignal
    + (card.fsrsCard.state === 3 ? 45 : 0)
    + recentAgainCount * 18
    + (lowRetrievability ? 20 : 0)

  return {
    isWeak: reasons.length > 0,
    score,
    againCount,
    recentAgainCount,
    recentReviewCount: recentLogs.length,
    recentAgainRate,
    spellingSignal,
    reasons,
    lastError: recentLogs.filter((log) => log.rating === 1).at(-1)?.reviewedAt,
  }
}

export function getWeakWordSignals(cards: LearningCard[], logs: ReviewLogRecord[], now = new Date()): Map<string, WeakWordSignal> {
  return new Map(cards.map((card) => [card.wordId, getWeakWordSignal(card, logs, now)]))
}
