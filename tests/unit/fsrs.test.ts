import { describe, expect, it } from 'vitest'
import { newSerializedCard, previewIntervals, scheduleCard } from '@/lib/fsrs'

describe('FSRS adapter', () => {
  it('creates a new card and schedules all four ratings through ts-fsrs', () => {
    const now = new Date('2026-08-22T08:00:00.000Z')
    const card = newSerializedCard(now)
    const preview = previewIntervals(card, now, 0.9)
    expect(card.state).toBe(0)
    expect(preview[1]).toBeTruthy()
    expect(preview[4]).toBeTruthy()
    for (const rating of [1, 2, 3, 4] as const) {
      const result = scheduleCard(card, rating, now, 0.9)
      expect(result.card.state).toBeGreaterThanOrEqual(1)
      expect(result.card.state).toBeLessThanOrEqual(3)
      expect(new Date(result.card.due).getTime()).toBeGreaterThanOrEqual(now.getTime())
      expect(result.log.rating).toBe(rating)
    }
  })

  it('keeps Again and Easy as distinct FSRS outcomes', () => {
    const now = new Date('2026-08-22T08:00:00.000Z')
    const card = newSerializedCard(now)
    const again = scheduleCard(card, 1, now, 0.9)
    const easy = scheduleCard(card, 4, now, 0.9)
    expect(again.card.due).not.toBe(easy.card.due)
    expect(again.log.rating).toBe(1)
    expect(easy.log.rating).toBe(4)
  })
})
