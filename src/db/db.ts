import Dexie, { type Table } from 'dexie'
import { defaultSettings, newSerializedCard } from '@/lib/fsrs'
import { createId } from '@/lib/id'
import { isDue, isMastered } from '@/lib/fsrs'
import { startOfDay } from '@/lib/dates'
import { sortDictationCandidates } from '@/lib/dictation'
import { isActiveWord, reconcileVocabulary } from '@/lib/migration'
import { getWeakWordSignal } from '@/lib/weak'
import { finishSessionRecord } from '@/lib/sessions'
import { withBase } from '@/lib/public-path'
import type {
  AppSettings,
  DashboardSummary,
  LearningCard,
  QueueItem,
  RatingValue,
  ReviewLogRecord,
  SessionType,
  StudySessionRecord,
  Word,
} from '@/types'

export const VOCABULARY_VERSION = 'cet6-vocab.v1'

export class Cet6Database extends Dexie {
  words!: Table<Word, string>
  cards!: Table<LearningCard, string>
  reviewLogs!: Table<ReviewLogRecord, number>
  sessions!: Table<StudySessionRecord, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('cet6-focus')
    this.version(1).stores({
      words: 'id,word,*examTags',
      cards: 'wordId,due,starred,spellingWrongCount',
      reviewLogs: '++id,wordId,sessionId,reviewedAt,rating',
      sessions: 'id,type,startedAt',
      settings: 'id',
    })
    this.version(2)
      .stores({
        words: 'id,word,*examTags',
        cards: 'wordId,due,state,starred,spellingWrongCount',
        reviewLogs: '++id,wordId,sessionId,reviewedAt,rating',
        sessions: 'id,type,startedAt',
        settings: 'id',
      })
      .upgrade((transaction) =>
        transaction.table('cards').toCollection().modify((card: LearningCard & { state?: number }) => {
          card.state = card.fsrsCard.state
          card.due = card.fsrsCard.due
        }),
      )
  }
}

export const db = new Cet6Database()

export function cardFromWord(word: Word, now = new Date()): LearningCard {
  const fsrsCard = newSerializedCard(now)
  return {
    wordId: word.id,
    due: fsrsCard.due,
    fsrsCard,
    starred: false,
    spellingWrongCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

let databaseMetadataPromise: Promise<void> | null = null
let databaseReadyPromise: Promise<void> | null = null
let activeWordIdsCache: Set<string> | null = null

export function ensureDatabaseMetadataReady(): Promise<void> {
  if (databaseMetadataPromise) return databaseMetadataPromise
  databaseMetadataPromise = (async () => {
    await db.open()
    if (!(await db.settings.get('app'))) await db.settings.put(defaultSettings())
  })().catch((error: unknown) => {
    databaseMetadataPromise = null
    throw error
  })
  return databaseMetadataPromise
}

export function ensureDatabaseReady(): Promise<void> {
  if (databaseReadyPromise) return databaseReadyPromise
  databaseReadyPromise = initializeDatabase().catch((error: unknown) => {
    databaseReadyPromise = null
    throw error
  })
  return databaseReadyPromise
}

async function initializeDatabase(): Promise<void> {
  await ensureDatabaseMetadataReady()
  const settings = await db.settings.get('app')
  const existingWords = await db.words.toArray()
  const existingCards = await db.cards.toArray()
  const activeExistingWords = existingWords.filter((word) => isActiveWord(word))
  const shouldFetchVocabulary = activeExistingWords.length === 0 || settings?.dataVersion !== VOCABULARY_VERSION
  const hasMissingActiveCard = activeExistingWords.some((word) => !existingCards.some((card) => card.wordId === word.id))
  if (shouldFetchVocabulary || hasMissingActiveCard) {
    const response = await fetch(withBase('data/cet6-vocab.v1.json'))
    if (!response.ok) throw new Error(`词库加载失败（${response.status}）`)
    const nextWords = (await response.json()) as Word[]
    if (!Array.isArray(nextWords) || nextWords.length < 1000) throw new Error('词库校验失败：条目数不足')
    const reconciliation = reconcileVocabulary(existingWords, existingCards, nextWords)
    // Never clear learning data during a static vocabulary upgrade. Existing
    // cards, including orphaned cards, are preserved byte-for-byte; only
    // new words receive a New card and removed words are archived. Separate
    // bounded writes keep WebKit from holding one long IndexedDB transaction
    // while importing the static 2k+ vocabulary payload.
    const batchSize = 200
    for (let offset = 0; offset < reconciliation.words.length; offset += batchSize) {
      await db.words.bulkPut(reconciliation.words.slice(offset, offset + batchSize))
    }
    const newCards = reconciliation.cards.filter((card) => !existingCards.some((existing) => existing.wordId === card.wordId))
    for (let offset = 0; offset < newCards.length; offset += batchSize) {
      await db.cards.bulkPut(newCards.slice(offset, offset + batchSize))
    }
    await db.settings.put({ ...(settings ?? defaultSettings()), dataVersion: VOCABULARY_VERSION, updatedAt: new Date().toISOString() })
  } else if (settings?.dataVersion !== VOCABULARY_VERSION) {
    await saveSettings({ dataVersion: VOCABULARY_VERSION })
  }
}

export async function getSettings(): Promise<AppSettings> {
  return (await db.settings.get('app')) ?? defaultSettings()
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const next: AppSettings = { ...current, ...patch, id: 'app', updatedAt: new Date().toISOString() }
  await db.settings.put(next)
  return next
}

export async function getWord(wordId: string): Promise<Word | undefined> {
  return db.words.get(wordId)
}

export async function getWordsByIds(ids: string[]): Promise<Word[]> {
  if (ids.length === 0) return []
  const words = await db.words.bulkGet(ids)
  return words.filter((word): word is Word => Boolean(word))
}

export async function getAllWords(): Promise<Word[]> {
  return db.words.toArray()
}

export async function getActiveWords(): Promise<Word[]> {
  const activeWords = (await db.words.toArray()).filter((word) => isActiveWord(word))
  activeWordIdsCache = new Set(activeWords.map((word) => word.id))
  return activeWords
}

async function getActiveWordIds(): Promise<Set<string>> {
  if (activeWordIdsCache) return activeWordIdsCache
  await getActiveWords()
  return activeWordIdsCache ?? new Set<string>()
}

export async function getArchivedWords(): Promise<Word[]> {
  return (await db.words.toArray()).filter((word) => word.archived)
}

export async function getCard(wordId: string): Promise<LearningCard | undefined> {
  return db.cards.get(wordId)
}

export async function getCardsByIds(ids: string[]): Promise<LearningCard[]> {
  if (ids.length === 0) return []
  const cards = await db.cards.bulkGet(ids)
  return cards.filter((card): card is LearningCard => Boolean(card))
}

export async function getReviewLogsSince(since: Date): Promise<ReviewLogRecord[]> {
  return db.reviewLogs.where('reviewedAt').aboveOrEqual(since.toISOString()).sortBy('reviewedAt')
}

export async function getSessionsSince(since: Date): Promise<StudySessionRecord[]> {
  return db.sessions.where('startedAt').aboveOrEqual(since.toISOString()).sortBy('startedAt')
}

export async function getDictationCandidates(limit = 10): Promise<LearningCard[]> {
  const [cards, words] = await Promise.all([db.cards.toArray(), getActiveWords()])
  const activeIds = new Set(words.map((word) => word.id))
  const candidates = cards
    .filter((card) => activeIds.has(card.wordId) && (card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0))
  return sortDictationCandidates(candidates).slice(0, limit)
}

export async function getQueue(type: 'study' | 'review' | 'weak', settings: Pick<AppSettings, 'dailyNewWords'>): Promise<QueueItem[]> {
  const now = new Date()
  const activeIds = await getActiveWordIds()
  const dueCards = await db.cards
    .where('due')
    .belowOrEqual(now.toISOString())
    .filter((card) => activeIds.has(card.wordId) && card.fsrsCard.state !== 0)
    .toArray()
  const due = dueCards
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
    .map((card) => ({ wordId: card.wordId, kind: 'due' as const }))

  if (type === 'review') return due
  if (type === 'study') {
    const newLimit = Math.max(0, settings.dailyNewWords)
    const newCards = newLimit === 0 ? [] : await db.cards
      .orderBy('wordId')
      .filter((card) => activeIds.has(card.wordId) && card.fsrsCard.state === 0)
      .limit(newLimit)
      .toArray()
    const dueIds = new Set(due.map((item) => item.wordId))
    return [...due, ...newCards.filter((card) => !dueIds.has(card.wordId)).map((card) => ({ wordId: card.wordId, kind: 'new' as const }))]
  }

  const [cards, logs] = await Promise.all([db.cards.toArray(), getReviewLogsSince(new Date(now.getTime() - 30 * 86_400_000))])
  const weak = cards
    .filter((card) => activeIds.has(card.wordId))
    .map((card) => ({ card, signal: getWeakWordSignal(card, logs, now) }))
    .filter(({ signal }) => signal.isWeak)
    .sort((a, b) => {
      return b.signal.score - a.signal.score
    })
    .slice(0, 15)
    .map(({ card }) => ({ wordId: card.wordId, kind: 'weak' as const }))

  return weak
}

export async function getDashboardSummary(settings: AppSettings): Promise<DashboardSummary> {
  const now = new Date()
  const todayStart = startOfDay(now)
  const [cards, words, todayLogs, sessions, recentLogs] = await Promise.all([
    db.cards.toArray(),
    getActiveWords(),
    getReviewLogsSince(todayStart),
    getSessionsSince(todayStart),
    getReviewLogsSince(new Date(now.getTime() - 30 * 86_400_000)),
  ])
  const activeIds = new Set(words.map((word) => word.id))
  const activeCards = cards.filter((card) => activeIds.has(card.wordId))
  const againCount = todayLogs.filter((log) => log.rating === 1).length
  const studyMinutes = sessions.reduce((sum, session) => sum + session.durationMs, 0) / 60_000
  const weakCount = activeCards.filter((card) => getWeakWordSignal(card, recentLogs, now).isWeak).length
  const mastered = activeCards.filter((card) => isMastered(card.fsrsCard, now, settings.targetRetention)).length
  return {
    dueCount: activeCards.filter((card) => isDue(card.fsrsCard, now)).length,
    newCount: activeCards.filter((card) => card.fsrsCard.state === 0).length,
    dictationCount: Math.min(10, activeCards.filter((card) => card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0).length),
    weakCount,
    encountered: activeCards.filter((card) => card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0).length,
    mastered,
    remaining: Math.max(0, activeCards.length - mastered),
    againRate: todayLogs.length ? againCount / todayLogs.length : 0,
    studyMinutes,
  }
}

export async function createSession(type: SessionType): Promise<StudySessionRecord> {
  const session: StudySessionRecord = {
    id: createId('session'),
    type,
    startedAt: new Date().toISOString(),
    wordCount: 0,
    againCount: 0,
    durationMs: 0,
    attempted: 0,
    correct: 0,
    wrong: 0,
    corrected: 0,
  }
  await db.sessions.put(session)
  return session
}

export async function finishSession(sessionId: string): Promise<void> {
  await db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(sessionId)
    if (!session || session.endedAt) return
    await db.sessions.put(finishSessionRecord(session))
  })
}

export async function recordReview(input: {
  wordId: string
  sessionId: string
  rating: RatingValue
  before: LearningCard
  after: LearningCard
  durationMs: number
}): Promise<ReviewLogRecord> {
  const reviewLog: ReviewLogRecord = {
    wordId: input.wordId,
    sessionId: input.sessionId,
    rating: input.rating,
    reviewedAt: new Date().toISOString(),
    durationMs: input.durationMs,
    before: input.before.fsrsCard,
    after: input.after.fsrsCard,
  }
  await db.transaction('rw', db.cards, db.reviewLogs, db.sessions, async () => {
    await db.cards.put(input.after)
    const id = await db.reviewLogs.add(reviewLog)
    const session = await db.sessions.get(input.sessionId)
    if (session) {
      await db.sessions.put({
        ...session,
        wordCount: session.wordCount + 1,
        againCount: session.againCount + (input.rating === 1 ? 1 : 0),
      })
    }
    reviewLog.id = id
  })
  return reviewLog
}

export async function undoLastReview(sessionId: string): Promise<ReviewLogRecord | undefined> {
  return db.transaction('rw', db.cards, db.reviewLogs, db.sessions, async () => {
    const log = await db.reviewLogs.where('sessionId').equals(sessionId).last()
    if (!log?.id) return undefined
    const card = await db.cards.get(log.wordId)
    if (!card) return undefined
    await db.cards.put({ ...card, due: log.before.due, fsrsCard: log.before, updatedAt: new Date().toISOString() })
    await db.reviewLogs.delete(log.id)
    const session = await db.sessions.get(sessionId)
    if (session) {
      await db.sessions.put({
        ...session,
        wordCount: Math.max(0, session.wordCount - 1),
        againCount: Math.max(0, session.againCount - (log.rating === 1 ? 1 : 0)),
        endedAt: undefined,
        durationMs: Math.max(0, Date.now() - new Date(session.startedAt).getTime()),
      })
    }
    return log
  })
}

export async function updateCard(wordId: string, patch: Partial<LearningCard>): Promise<LearningCard | undefined> {
  const card = await db.cards.get(wordId)
  if (!card) return undefined
  const next = { ...card, ...patch, updatedAt: new Date().toISOString() }
  await db.cards.put(next)
  return next
}

export async function toggleStar(wordId: string): Promise<LearningCard | undefined> {
  const card = await db.cards.get(wordId)
  return card ? updateCard(wordId, { starred: !card.starred }) : undefined
}

export async function incrementSpellingWrong(wordId: string): Promise<LearningCard | undefined> {
  const card = await db.cards.get(wordId)
  return card
    ? updateCard(wordId, { spellingWrongCount: card.spellingWrongCount + 1, lastSpellingAt: new Date().toISOString() })
    : undefined
}

export async function recordDictationAttempt(sessionId: string, wordId: string, result: 'correct' | 'wrong'): Promise<void> {
  await db.transaction('rw', db.cards, db.sessions, async () => {
    const now = new Date().toISOString()
    const card = await db.cards.get(wordId)
    if (card) await db.cards.put({ ...card, lastDictationAt: now, updatedAt: now })
    const session = await db.sessions.get(sessionId)
    if (!session) return
    await db.sessions.put({
      ...session,
      attempted: (session.attempted ?? 0) + 1,
      correct: (session.correct ?? 0) + (result === 'correct' ? 1 : 0),
      wrong: (session.wrong ?? 0) + (result === 'wrong' ? 1 : 0),
      wordCount: session.wordCount + (result === 'correct' ? 1 : 0),
    })
  })
}

export async function recordDictationCorrection(sessionId: string, wordId: string): Promise<void> {
  await db.transaction('rw', db.cards, db.sessions, async () => {
    const now = new Date().toISOString()
    const card = await db.cards.get(wordId)
    if (card) await db.cards.put({ ...card, lastDictationAt: now, updatedAt: now })
    const session = await db.sessions.get(sessionId)
    if (!session) return
    await db.sessions.put({
      ...session,
      corrected: (session.corrected ?? 0) + 1,
      wordCount: session.wordCount + 1,
    })
  })
}

export async function savePersonalNote(wordId: string, personalNote: string): Promise<LearningCard | undefined> {
  return updateCard(wordId, { personalNote })
}

export async function resetLearningData(): Promise<void> {
  const words = await db.words.toArray()
  const now = new Date()
  await db.transaction('rw', db.cards, db.reviewLogs, db.sessions, async () => {
    await db.cards.clear()
    await db.reviewLogs.clear()
    await db.sessions.clear()
    await db.cards.bulkPut(words.map((word) => cardFromWord(word, now)))
  })
}

export async function getReviewLogs(): Promise<ReviewLogRecord[]> {
  return db.reviewLogs.orderBy('reviewedAt').toArray()
}

export async function getSessions(): Promise<StudySessionRecord[]> {
  return db.sessions.orderBy('startedAt').toArray()
}

export async function getCards(): Promise<LearningCard[]> {
  return db.cards.toArray()
}

export async function replaceLearningData(
  cards: LearningCard[],
  reviewLogs: ReviewLogRecord[],
  sessions: StudySessionRecord[],
  settings: AppSettings | null,
  orphanWords: Word[] = [],
): Promise<void> {
  await db.transaction('rw', db.words, db.cards, db.reviewLogs, db.sessions, db.settings, async () => {
    await db.cards.clear()
    await db.reviewLogs.clear()
    await db.sessions.clear()
    if (cards.length) await db.cards.bulkPut(cards)
    if (reviewLogs.length) await db.reviewLogs.bulkPut(reviewLogs)
    if (sessions.length) await db.sessions.bulkPut(sessions)
    if (settings) {
      // A restore may come from an older local schema. Mark the imported
      // settings current after the static vocabulary has already been retained;
      // this keeps the reload deterministic instead of exposing the legacy
      // marker during the reconciliation window.
      await db.settings.put({ ...settings, dataVersion: VOCABULARY_VERSION, updatedAt: new Date().toISOString() })
    }
    for (const word of orphanWords) {
      const current = await db.words.get(word.id)
      if (!current || current.archived) await db.words.put({ ...word, archived: true })
    }
  })
  activeWordIdsCache = null
}
