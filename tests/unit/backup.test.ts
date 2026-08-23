import { describe, expect, it } from 'vitest'
import { validateBackup } from '@/lib/backup'
import { newSerializedCard, defaultSettings } from '@/lib/fsrs'

describe('backup validation', () => {
  function validPayload() {
    const card = newSerializedCard()
    return { schemaVersion: 1, exportedAt: new Date().toISOString(), cards: [{ wordId: 'cet6-test', due: card.due, fsrsCard: card, starred: false, spellingWrongCount: 0, lastDictationAt: '2026-08-22T08:00:00.000Z', createdAt: card.due, updatedAt: card.due }], reviewLogs: [], sessions: [], settings: defaultSettings() }
  }

  it('accepts a structurally valid backup', () => {
    const result = validateBackup(validPayload())
    expect(result.ok).toBe(true)
  })

  it('rejects unsupported versions without touching data', () => {
    const result = validateBackup({ schemaVersion: 99, cards: [], reviewLogs: [], sessions: [], settings: null })
    expect(result).toEqual({ ok: false, error: '不支持的备份版本：99' })
  })

  it('rejects malformed dates before they reach IndexedDB', () => {
    const payload = validPayload()
    payload.exportedAt = 'not-a-date'
    expect(validateBackup(payload)).toEqual({ ok: false, error: 'exportedAt 时间字段无效。' })

    const card = newSerializedCard()
    const invalidCardPayload = validPayload()
    invalidCardPayload.cards[0].fsrsCard = { ...card, due: 'not-a-date' }
    expect(validateBackup(invalidCardPayload)).toEqual({ ok: false, error: 'cards 数据结构不完整。' })

    const invalidDictationPayload = validPayload()
    invalidDictationPayload.cards[0].lastDictationAt = 'not-a-date'
    expect(validateBackup(invalidDictationPayload)).toEqual({ ok: false, error: 'cards 数据结构不完整。' })
  })
})
