import type { ReviewLogRecord, StudySessionRecord } from '@/types'

export interface DictationStats {
  attempted: number
  firstTryCorrect: number
  wrong: number
  corrected: number
  accuracy: number
}

export function getDictationStats(sessions: StudySessionRecord[]): DictationStats {
  const dictation = sessions.filter((session) => session.type === 'dictation')
  const attempted = dictation.reduce((sum, session) => sum + (session.attempted ?? 0), 0)
  const firstTryCorrect = dictation.reduce((sum, session) => sum + (session.correct ?? 0), 0)
  return {
    attempted,
    firstTryCorrect,
    wrong: dictation.reduce((sum, session) => sum + (session.wrong ?? 0), 0),
    corrected: dictation.reduce((sum, session) => sum + (session.corrected ?? 0), 0),
    accuracy: attempted ? firstTryCorrect / attempted : 0,
  }
}

export function getReviewLogsForSessions(logs: ReviewLogRecord[], sessions: StudySessionRecord[]): ReviewLogRecord[] {
  const dictationIds = new Set(sessions.filter((session) => session.type === 'dictation').map((session) => session.id))
  return logs.filter((log) => !dictationIds.has(log.sessionId))
}
