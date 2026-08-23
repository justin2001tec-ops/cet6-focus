import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs'
import type { Card, FSRSParameters, Grade, RecordLogItem } from 'ts-fsrs'
import type { AppSettings, FsrsCardSerialized, RatingValue } from '@/types'

const RATING_MAP: Record<RatingValue, Grade> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
}

export function createScheduler(targetRetention = 0.9) {
  const params: Partial<FSRSParameters> = { request_retention: targetRetention }
  return fsrs(params)
}

export function serializeCard(card: Card): FsrsCardSerialized {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    ...(card.last_review ? { lastReview: card.last_review.toISOString() } : {}),
  }
}

export function deserializeCard(serialized: FsrsCardSerialized): Card {
  return {
    due: new Date(serialized.due),
    stability: serialized.stability,
    difficulty: serialized.difficulty,
    elapsed_days: serialized.elapsedDays,
    scheduled_days: serialized.scheduledDays,
    learning_steps: serialized.learningSteps,
    reps: serialized.reps,
    lapses: serialized.lapses,
    state: serialized.state as State,
    ...(serialized.lastReview ? { last_review: new Date(serialized.lastReview) } : {}),
  }
}

export function newSerializedCard(now = new Date()): FsrsCardSerialized {
  return serializeCard(createEmptyCard(now))
}

export function scheduleCard(
  before: FsrsCardSerialized,
  rating: RatingValue,
  now = new Date(),
  targetRetention = 0.9,
): { card: FsrsCardSerialized; log: RecordLogItem['log'] } {
  const scheduler = createScheduler(targetRetention)
  const result = scheduler.next(deserializeCard(before), now, RATING_MAP[rating])
  return { card: serializeCard(result.card), log: result.log }
}

export function previewIntervals(
  before: FsrsCardSerialized,
  now = new Date(),
  targetRetention = 0.9,
): Record<RatingValue, string> {
  const scheduler = createScheduler(targetRetention)
  const preview = scheduler.repeat(deserializeCard(before), now)
  return {
    1: preview[Rating.Again].card.due.toISOString(),
    2: preview[Rating.Hard].card.due.toISOString(),
    3: preview[Rating.Good].card.due.toISOString(),
    4: preview[Rating.Easy].card.due.toISOString(),
  }
}

export function retrievability(card: FsrsCardSerialized, now = new Date(), targetRetention = 0.9): number {
  if (card.state === State.New) return 0
  return createScheduler(targetRetention).get_retrievability(deserializeCard(card), now, false)
}

export function stateLabel(state: number): string {
  if (state === State.New) return 'New'
  if (state === State.Learning) return 'Learning'
  if (state === State.Review) return 'Review'
  return 'Relearning'
}

export function isDue(card: FsrsCardSerialized, now = new Date()): boolean {
  return card.state !== State.New && new Date(card.due).getTime() <= now.getTime()
}

export function isMastered(card: FsrsCardSerialized, now = new Date(), targetRetention = 0.9): boolean {
  return card.state === State.Review && card.stability >= 14 && retrievability(card, now, targetRetention) >= targetRetention && card.reps >= 3
}

export function defaultSettings(): AppSettings {
  return {
    id: 'app',
    onboarded: false,
    dailyNewWords: 30,
    dailyMinutes: 20,
    targetRetention: 0.9,
    pronunciation: 'en-US',
    autoplayPronunciation: false,
    theme: 'light',
    backgroundMode: 'random',
    reducedMotion: false,
    dataVersion: 'cet6-vocab.v1',
    updatedAt: new Date().toISOString(),
  }
}
