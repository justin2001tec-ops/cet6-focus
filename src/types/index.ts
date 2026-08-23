import type { Card, State } from 'ts-fsrs'

export type RatingValue = 1 | 2 | 3 | 4
export type Theme = 'light' | 'dark' | 'system'
export type BackgroundMode = 'random' | 'fixed' | 'off'
export type Pronunciation = 'en-GB' | 'en-US'
export type SessionType = 'study' | 'review' | 'dictation' | 'weak'

export interface WordExample {
  en: string
  zh?: string
}

export interface Word {
  id: string
  word: string
  phonetic?: string
  pos?: string[]
  meaningZh: string[]
  definitionEn?: string[]
  collocations?: string[]
  examples?: WordExample[]
  wordForms?: Record<string, string>
  frequency?: { bnc?: number; contemporary?: number }
  examTags?: string[]
  source: string
  sourceLicense?: string
  archived?: boolean
}

export interface FsrsCardSerialized {
  due: string
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  learningSteps: number
  reps: number
  lapses: number
  state: number
  lastReview?: string
}

export interface LearningCard {
  wordId: string
  due: string
  fsrsCard: FsrsCardSerialized
  starred: boolean
  personalNote?: string
  spellingWrongCount: number
  lastSpellingAt?: string
  lastDictationAt?: string
  createdAt: string
  updatedAt: string
}

export interface ReviewLogRecord {
  id?: number
  wordId: string
  sessionId: string
  rating: RatingValue
  reviewedAt: string
  durationMs?: number
  before: FsrsCardSerialized
  after: FsrsCardSerialized
}

export interface StudySessionRecord {
  id: string
  type: SessionType
  startedAt: string
  endedAt?: string
  wordCount: number
  againCount: number
  durationMs: number
  attempted?: number
  correct?: number
  wrong?: number
  corrected?: number
}

export interface AppSettings {
  id: 'app'
  onboarded: boolean
  examDate?: string
  dailyNewWords: number
  dailyMinutes: number
  targetRetention: number
  pronunciation: Pronunciation
  autoplayPronunciation: boolean
  theme: Theme
  backgroundMode: BackgroundMode
  backgroundId?: string
  lastBackgroundId?: string
  reducedMotion: boolean
  dataVersion: string
  updatedAt: string
}

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  cards: LearningCard[]
  reviewLogs: ReviewLogRecord[]
  sessions: StudySessionRecord[]
  settings: AppSettings | null
  orphanWords?: Word[]
}

export interface DashboardSummary {
  dueCount: number
  newCount: number
  dictationCount: number
  weakCount: number
  encountered: number
  mastered: number
  remaining: number
  againRate: number
  studyMinutes: number
}

export interface QueueItem {
  wordId: string
  kind: 'due' | 'new' | 'weak'
}

export type FsrsCard = Card
export type FsrsState = State
