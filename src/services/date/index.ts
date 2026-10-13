import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isValid,
  startOfWeek,
} from 'date-fns'
import { uz } from 'date-fns/locale'

/**
 * Date-only values are stored as `YYYY-MM-DD` strings ("date keys").
 * Never pass a date key to `new Date(key)` — that parses as UTC and can shift a day
 * in negative/positive offsets. Always go through `parseDateKey`.
 */
export type DateKey = string
/** Month key: `YYYY-MM`. */
export type MonthKey = string

export const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/
export const MONTH_KEY_RE = /^\d{4}-\d{2}$/

/** Monday. */
export const WEEK_STARTS_ON = 1 as const

export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parses a date key as a local-time Date at midnight. */
export function parseDateKey(key: DateKey): Date {
  if (!DATE_KEY_RE.test(key)) {
    throw new Error(`Invalid date key: ${key}`)
  }
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (!isValid(date) || date.getMonth() !== m - 1) {
    throw new Error(`Invalid date key: ${key}`)
  }
  return date
}

export function isValidDateKey(key: unknown): key is DateKey {
  if (typeof key !== 'string' || !DATE_KEY_RE.test(key)) return false
  try {
    parseDateKey(key)
    return true
  } catch {
    return false
  }
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now)
}

export function addDaysKey(key: DateKey, amount: number): DateKey {
  return toDateKey(addDays(parseDateKey(key), amount))
}

export function startOfWeekKey(key: DateKey): DateKey {
  return toDateKey(startOfWeek(parseDateKey(key), { weekStartsOn: WEEK_STARTS_ON }))
}

export function endOfWeekKey(weekStart: DateKey): DateKey {
  return addDaysKey(startOfWeekKey(weekStart), 6)
}

/** The 7 date keys of the week (Monday..Sunday) that contains `key`. */
export function weekDays(key: DateKey): DateKey[] {
  const start = startOfWeekKey(key)
  return Array.from({ length: 7 }, (_, i) => addDaysKey(start, i))
}

export function isDateInRange(key: DateKey, from: DateKey, to: DateKey): boolean {
  return key >= from && key <= to
}

export function diffDays(later: DateKey, earlier: DateKey): number {
  return differenceInCalendarDays(parseDateKey(later), parseDateKey(earlier))
}

/** Converts an ISO timestamp to the local date key. */
export function isoToDateKey(iso: string): DateKey {
  return toDateKey(new Date(iso))
}

export function monthKeyOf(key: DateKey): MonthKey {
  return key.slice(0, 7)
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return monthKeyOf(toDateKey(now))
}

export function addMonthsKey(month: MonthKey, amount: number): MonthKey {
  const [y, m] = month.split('-').map(Number)
  return monthKeyOf(toDateKey(addMonths(new Date(y, m - 1, 1), amount)))
}

/** Last `count` week starts, oldest first, ending with the week of `key`. */
export function recentWeekStarts(key: DateKey, count: number): DateKey[] {
  const current = startOfWeekKey(key)
  return Array.from({ length: count }, (_, i) => addDaysKey(current, -7 * (count - 1 - i)))
}

export function recentMonths(month: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => addMonthsKey(month, -(count - 1 - i)))
}

// ---------- Formatting (Uzbek, Latin) ----------

export function formatDate(key: DateKey, pattern = 'd MMMM yyyy'): string {
  return format(parseDateKey(key), pattern, { locale: uz })
}

export function formatDateShort(key: DateKey): string {
  return format(parseDateKey(key), 'd MMM', { locale: uz })
}

export function formatWeekday(key: DateKey, pattern = 'EEEE'): string {
  return format(parseDateKey(key), pattern, { locale: uz })
}

export function formatMonth(month: MonthKey): string {
  return format(parseDateKey(`${month}-01`), 'LLLL yyyy', { locale: uz })
}

export function formatWeekRange(weekStart: DateKey): string {
  const end = endOfWeekKey(weekStart)
  const s = parseDateKey(weekStart)
  const e = parseDateKey(end)
  if (s.getMonth() === e.getMonth()) {
    return `${format(s, 'd', { locale: uz })}–${format(e, 'd MMMM', { locale: uz })}`
  }
  return `${format(s, 'd MMM', { locale: uz })} – ${format(e, 'd MMM', { locale: uz })}`
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'd MMM, HH:mm', { locale: uz })
}

export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} daq`
  if (m === 0) return `${h} soat`
  return `${h} soat ${m} daq`
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Human relative label for a due date: "Bugun", "Ertaga", "3 kun qoldi", "2 kun o'tdi". */
export function relativeDayLabel(key: DateKey, today: DateKey = todayKey()): string {
  const d = diffDays(key, today)
  if (d === 0) return 'Bugun'
  if (d === 1) return 'Ertaga'
  if (d === -1) return 'Kecha'
  if (d > 1) return `${d} kun qoldi`
  return `${Math.abs(d)} kun o‘tdi`
}

export function greetingFor(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Xayrli tun'
  if (h < 12) return 'Xayrli tong'
  if (h < 18) return 'Xayrli kun'
  return 'Xayrli kech'
}
