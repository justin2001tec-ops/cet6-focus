import { describe, expect, it } from 'vitest'
import { dateKey } from '@/lib/dates'

describe('date helpers', () => {
  it('formats the local calendar date without a UTC day shift', () => {
    const value = new Date(2026, 7, 22, 23, 30)
    const expected = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    expect(dateKey(value)).toBe(expected)
  })
})
