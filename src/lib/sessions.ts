import type { StudySessionRecord } from '@/types'

/** Finish a session once; cleanup paths may safely call this more than once. */
export function finishSessionRecord(session: StudySessionRecord, endedAt = new Date()): StudySessionRecord {
  if (session.endedAt) return session
  return {
    ...session,
    endedAt: endedAt.toISOString(),
    durationMs: Math.max(0, endedAt.getTime() - new Date(session.startedAt).getTime()),
  }
}
