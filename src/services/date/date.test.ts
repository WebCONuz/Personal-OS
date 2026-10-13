import { describe, expect, it } from 'vitest'
import {
  addDaysKey,
  addMonthsKey,
  endOfWeekKey,
  isValidDateKey,
  parseDateKey,
  recentWeekStarts,
  relativeDayLabel,
  startOfWeekKey,
  toDateKey,
  weekDays,
} from './index'

describe('date keys', () => {
  it('parses a date-only key as local midnight without a day shift', () => {
    const d = parseDateKey('2026-10-13')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(9)
    expect(d.getDate()).toBe(13)
    expect(d.getHours()).toBe(0)
    expect(toDateKey(d)).toBe('2026-10-13')
  })

  it('rejects invalid keys', () => {
    expect(isValidDateKey('2026-02-30')).toBe(false)
    expect(isValidDateKey('2026-2-3')).toBe(false)
    expect(isValidDateKey(20261013)).toBe(false)
    expect(isValidDateKey('2024-02-29')).toBe(true)
  })

  it('weeks start on Monday', () => {
    expect(startOfWeekKey('2026-10-13')).toBe('2026-10-12') // Tuesday → Monday
    expect(startOfWeekKey('2026-10-18')).toBe('2026-10-12') // Sunday belongs to the same week
    expect(startOfWeekKey('2026-10-19')).toBe('2026-10-19') // Monday
    expect(endOfWeekKey('2026-10-12')).toBe('2026-10-18')
    expect(weekDays('2026-10-15')).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ])
  })

  it('handles month and year boundaries', () => {
    expect(addDaysKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysKey('2024-03-01', -1)).toBe('2024-02-29')
    expect(addMonthsKey('2026-01', -1)).toBe('2025-12')
    expect(startOfWeekKey('2027-01-01')).toBe('2026-12-28')
  })

  it('lists recent week starts oldest first', () => {
    expect(recentWeekStarts('2026-10-13', 3)).toEqual(['2026-09-28', '2026-10-05', '2026-10-12'])
  })

  it('produces neutral relative labels', () => {
    expect(relativeDayLabel('2026-10-13', '2026-10-13')).toBe('Bugun')
    expect(relativeDayLabel('2026-10-14', '2026-10-13')).toBe('Ertaga')
    expect(relativeDayLabel('2026-10-10', '2026-10-13')).toBe('3 kun o‘tdi')
  })
})
