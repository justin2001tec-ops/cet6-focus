import { describe, expect, it } from 'vitest'
import { finishSessionRecord } from '@/lib/sessions'
import type { StudySessionRecord } from '@/types'

const session: StudySessionRecord = {
  id: 'session-test',
  type: 'study',
  startedAt: '2026-08-22T08:00:00.000Z',
  wordCount: 2,
  againCount: 1,
  durationMs: 0,
  attempted: 0,
  correct: 0,
  wrong: 0,
  corrected: 0,
}

describe('session finalization', () => {
  it('writes the first end time and duration', () => {
    const finished = finishSessionRecord(session, new Date('2026-08-22T08:01:30.000Z'))
    expect(finished).toMatchObject({ endedAt: '2026-08-22T08:01:30.000Z', durationMs: 90_000 })
  })

  it('is idempotent when cleanup calls finish again', () => {
    const first = finishSessionRecord(session, new Date('2026-08-22T08:01:30.000Z'))
    const second = finishSessionRecord(first, new Date('2026-08-22T08:08:00.000Z'))
    expect(second).toEqual(first)
  })
})
