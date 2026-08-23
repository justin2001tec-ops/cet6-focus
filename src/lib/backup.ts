import type { BackupPayload, AppSettings, LearningCard, ReviewLogRecord, StudySessionRecord, Word } from '@/types'
import { getArchivedWords, getCards, getReviewLogs, getSessions, getSettings, replaceLearningData } from '@/db/db'

export const BACKUP_SCHEMA_VERSION = 1

export async function createBackup(): Promise<BackupPayload> {
  const [cards, reviewLogs, sessions, settings, orphanWords] = await Promise.all([getCards(), getReviewLogs(), getSessions(), getSettings(), getArchivedWords()])
  return { schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString(), cards, reviewLogs, sessions, settings, orphanWords: orphanWords.length ? orphanWords : undefined }
}

export function downloadBackup(payload: BackupPayload): void {
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `cet6-focus-backup-${date}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isFsrsCard(value: unknown): value is LearningCard['fsrsCard'] {
  if (!value || typeof value !== 'object') return false
  const card = value as Partial<LearningCard['fsrsCard']>
  return isDateString(card.due)
    && [card.stability, card.difficulty, card.elapsedDays, card.scheduledDays, card.learningSteps, card.reps, card.lapses].every((item) => typeof item === 'number' && Number.isFinite(item))
    && typeof card.state === 'number'
    && Number.isInteger(card.state)
    && card.state >= 0
    && card.state <= 3
    && (card.lastReview === undefined || isDateString(card.lastReview))
}

function isCard(value: unknown): value is LearningCard {
  if (!value || typeof value !== 'object') return false
  const card = value as Partial<LearningCard>
  return typeof card.wordId === 'string'
    && isDateString(card.due)
    && isFsrsCard(card.fsrsCard)
    && typeof card.starred === 'boolean'
    && typeof card.spellingWrongCount === 'number'
    && Number.isFinite(card.spellingWrongCount)
    && card.spellingWrongCount >= 0
    && (card.personalNote === undefined || typeof card.personalNote === 'string')
    && (card.lastSpellingAt === undefined || isDateString(card.lastSpellingAt))
    && (card.lastDictationAt === undefined || isDateString(card.lastDictationAt))
    && isDateString(card.createdAt)
    && isDateString(card.updatedAt)
}

function isReviewLog(value: unknown): value is ReviewLogRecord {
  if (!value || typeof value !== 'object') return false
  const log = value as Partial<ReviewLogRecord>
  return typeof log.wordId === 'string'
    && typeof log.sessionId === 'string'
    && [1, 2, 3, 4].includes(log.rating ?? 0)
    && isDateString(log.reviewedAt)
    && (log.durationMs === undefined || (typeof log.durationMs === 'number' && Number.isFinite(log.durationMs) && log.durationMs >= 0))
    && isFsrsCard(log.before)
    && isFsrsCard(log.after)
}

function isWord(value: unknown): value is Word {
  if (!value || typeof value !== 'object') return false
  const word = value as Partial<Word>
  return typeof word.id === 'string'
    && typeof word.word === 'string'
    && Array.isArray(word.meaningZh)
    && word.meaningZh.every((item) => typeof item === 'string')
    && typeof word.source === 'string'
    && (word.archived === undefined || typeof word.archived === 'boolean')
}

function isSession(value: unknown): value is StudySessionRecord {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<StudySessionRecord>
  return typeof session.id === 'string'
    && ['study', 'review', 'dictation', 'weak'].includes(session.type ?? '')
    && isDateString(session.startedAt)
    && (session.endedAt === undefined || isDateString(session.endedAt))
    && [session.wordCount, session.againCount, session.durationMs].every((item) => typeof item === 'number' && Number.isFinite(item) && item >= 0)
    && [session.attempted, session.correct, session.wrong, session.corrected].every((item) => item === undefined || (typeof item === 'number' && Number.isFinite(item) && item >= 0))
}

function isSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false
  const settings = value as Partial<AppSettings>
  return settings.id === 'app'
    && typeof settings.onboarded === 'boolean'
    && typeof settings.dailyNewWords === 'number'
    && Number.isFinite(settings.dailyNewWords)
    && settings.dailyNewWords >= 0
    && typeof settings.dailyMinutes === 'number'
    && Number.isFinite(settings.dailyMinutes)
    && settings.dailyMinutes > 0
    && typeof settings.targetRetention === 'number'
    && Number.isFinite(settings.targetRetention)
    && settings.targetRetention > 0
    && settings.targetRetention <= 1
    && (settings.examDate === undefined || /^\d{4}-\d{2}-\d{2}$/.test(settings.examDate))
    && (settings.pronunciation === 'en-GB' || settings.pronunciation === 'en-US')
    && typeof settings.autoplayPronunciation === 'boolean'
    && (settings.theme === 'light' || settings.theme === 'dark' || settings.theme === 'system')
    && (settings.backgroundMode === 'random' || settings.backgroundMode === 'fixed' || settings.backgroundMode === 'off')
    && (settings.backgroundId === undefined || typeof settings.backgroundId === 'string')
    && (settings.lastBackgroundId === undefined || typeof settings.lastBackgroundId === 'string')
    && typeof settings.reducedMotion === 'boolean'
    && typeof settings.dataVersion === 'string'
    && isDateString(settings.updatedAt)
}

export function validateBackup(input: unknown): { ok: true; payload: BackupPayload; summary: string } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: '文件不是 JSON 对象。' }
  const value = input as Partial<BackupPayload>
  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) return { ok: false, error: `不支持的备份版本：${String(value.schemaVersion)}` }
  if (!isDateString(value.exportedAt)) return { ok: false, error: 'exportedAt 时间字段无效。' }
  if (!Array.isArray(value.cards) || !value.cards.every(isCard)) return { ok: false, error: 'cards 数据结构不完整。' }
  if (!Array.isArray(value.reviewLogs) || !value.reviewLogs.every(isReviewLog)) return { ok: false, error: 'reviewLogs 数据结构不完整。' }
  if (!Array.isArray(value.sessions) || !value.sessions.every(isSession)) return { ok: false, error: 'sessions 数据结构不完整。' }
  if (value.settings !== null && !isSettings(value.settings)) return { ok: false, error: 'settings 数据结构不完整。' }
  if (value.orphanWords !== undefined && (!Array.isArray(value.orphanWords) || !value.orphanWords.every(isWord))) return { ok: false, error: 'orphanWords 数据结构不完整。' }
  const payload = value as BackupPayload
  return {
    ok: true,
    payload,
    summary: `${payload.cards.length} 张卡片 · ${payload.reviewLogs.length} 条复习记录 · ${payload.sessions.length} 个学习会话`,
  }
}

export async function restoreBackup(payload: BackupPayload): Promise<void> {
  await replaceLearningData(payload.cards, payload.reviewLogs, payload.sessions.map((session) => ({
    ...session,
    attempted: session.attempted ?? 0,
    correct: session.correct ?? 0,
    wrong: session.wrong ?? 0,
    corrected: session.corrected ?? 0,
  })), payload.settings, payload.orphanWords)
}
