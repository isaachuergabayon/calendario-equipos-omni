import { describe, it, expect } from 'vitest'
import { toDateKey, countWorkingDays } from './dateUtils'

describe('toDateKey', () => {
  it('formats a date with zero-padded month and day', () => {
    expect(toDateKey(new Date(2024, 0, 5))).toBe('2024-01-05')
  })

  it('formats a date at end of year', () => {
    expect(toDateKey(new Date(2024, 11, 31))).toBe('2024-12-31')
  })

  it('formats a double-digit month and day without extra padding', () => {
    expect(toDateKey(new Date(2025, 9, 15))).toBe('2025-10-15')
  })
})

describe('countWorkingDays', () => {
  it('counts all 5 days in a Mon–Fri week', () => {
    // Mon 13 Jan 2025 to Fri 17 Jan 2025
    expect(countWorkingDays('2025-01-13', '2025-01-17', new Set())).toBe(5)
  })

  it('excludes Saturday and Sunday when range spans a full week', () => {
    // Mon 13 Jan to Sun 19 Jan → 5 working days
    expect(countWorkingDays('2025-01-13', '2025-01-19', new Set())).toBe(5)
  })

  it('returns 0 for a Saturday–Sunday range', () => {
    expect(countWorkingDays('2025-01-11', '2025-01-12', new Set())).toBe(0)
  })

  it('returns 1 for a single working day', () => {
    expect(countWorkingDays('2025-01-13', '2025-01-13', new Set())).toBe(1)
  })

  it('subtracts public holidays from the count', () => {
    const holidays = new Set(['2025-01-15'])
    // Wed 15 Jan is a holiday → 4 instead of 5
    expect(countWorkingDays('2025-01-13', '2025-01-17', holidays)).toBe(4)
  })

  it('does not subtract a holiday that falls on a weekend', () => {
    // Sat 11 Jan marked as holiday — already excluded, count unchanged
    const holidays = new Set(['2025-01-11'])
    expect(countWorkingDays('2025-01-13', '2025-01-17', holidays)).toBe(5)
  })

  it('handles same start and end on a weekend', () => {
    expect(countWorkingDays('2025-01-12', '2025-01-12', new Set())).toBe(0)
  })
})
