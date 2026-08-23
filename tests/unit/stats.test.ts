import { describe, expect, it } from 'vitest'
import { getDictationStats, getReviewLogsForSessions } from '@/lib/stats'
import type { ReviewLogRecord, StudySessionRecord } from '@/types'

function session(id: string, type: StudySessionRecord['type'], stats: Partial<StudySessionRecord> = {}): StudySessionRecord {
  return { id, type, startedAt: '2026-08-22T08:00:00.000Z', wordCount: 0, againCount: 0, durationMs: 0, ...stats }
}

describe('learning statistics', () => {
  it('calculates first-try dictation accuracy separately from corrections', () => {
    const result = getDictationStats([session('dictation', 'dictation', { attempted: 4, correct: 2, wrong: 2, corrected: 2 }), session('study', 'study', { wordCount: 3 })])
    expect(result).toEqual({ attempted: 4, firstTryCorrect: 2, wrong: 2, corrected: 2, accuracy: 0.5 })
  })

  it('excludes dictation sessions from ReviewLog performance', () => {
    const logs = [{ wordId: 'a', sessionId: 'study', rating: 3, reviewedAt: '2026-08-22T08:00:00.000Z', before: {} as never, after: {} as never }, { wordId: 'b', sessionId: 'dictation', rating: 2, reviewedAt: '2026-08-22T08:00:00.000Z', before: {} as never, after: {} as never }] as ReviewLogRecord[]
    expect(getReviewLogsForSessions(logs, [session('study', 'study'), session('dictation', 'dictation')])).toHaveLength(1)
    expect(getReviewLogsForSessions(logs, [session('study', 'study'), session('dictation', 'dictation')])[0].sessionId).toBe('study')
  })
})
