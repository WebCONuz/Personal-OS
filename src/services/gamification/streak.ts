import { addDaysKey, isoToDateKey, startOfWeekKey, todayKey, type DateKey } from '@/services/date'
import type { Habit, HabitLog, Task } from '@/types'

export const STREAK_RULE_TEXT =
  'Streak — ketma-ket faol kunlar soni. Kamida bitta vazifa yoki odat bajarilgan kun faol hisoblanadi. Bugun hali hech narsa belgilanmagan bo‘lsa, streak buzilmaydi.'

export const HABIT_STREAK_RULE_TEXT =
  'Kunlik odatlar uchun streak ketma-ket bajarilgan kunlar soni. Haftalik odatlar uchun — haftalik target bajarilgan ketma-ket haftalar. Joriy kun yoki hafta hali tugamagani uchun streakni buzmaydi.'

/** Consecutive days with activity, ending today (or yesterday if today has no activity yet). */
export function consecutiveDays(activeDays: ReadonlySet<DateKey>, today: DateKey = todayKey()): number {
  let cursor = activeDays.has(today) ? today : addDaysKey(today, -1)
  let count = 0
  while (activeDays.has(cursor)) {
    count++
    cursor = addDaysKey(cursor, -1)
  }
  return count
}

export function activityDays(tasks: readonly Task[], habitLogs: readonly HabitLog[]): Set<DateKey> {
  const days = new Set<DateKey>()
  for (const t of tasks) {
    if (t.status === 'done' && t.completedAt) days.add(isoToDateKey(t.completedAt))
  }
  for (const log of habitLogs) {
    if (log.completed) days.add(log.date)
  }
  return days
}

export function activityStreak(tasks: readonly Task[], habitLogs: readonly HabitLog[], today: DateKey = todayKey()): number {
  return consecutiveDays(activityDays(tasks, habitLogs), today)
}

function completedDates(habitId: string, logs: readonly HabitLog[]): Set<DateKey> {
  return new Set(logs.filter((l) => l.habitId === habitId && l.completed).map((l) => l.date))
}

export function completedInWeek(habitId: string, logs: readonly HabitLog[], weekStart: DateKey): number {
  const end = addDaysKey(weekStart, 6)
  return logs.filter((l) => l.habitId === habitId && l.completed && l.date >= weekStart && l.date <= end).length
}

export function habitStreak(habit: Habit, logs: readonly HabitLog[], today: DateKey = todayKey()): number {
  if (habit.frequency === 'daily') {
    return consecutiveDays(completedDates(habit.id, logs), today)
  }
  const currentWeek = startOfWeekKey(today)
  let week = completedInWeek(habit.id, logs, currentWeek) >= habit.targetPerWeek ? currentWeek : addDaysKey(currentWeek, -7)
  let count = 0
  while (completedInWeek(habit.id, logs, week) >= habit.targetPerWeek) {
    count++
    week = addDaysKey(week, -7)
  }
  return count
}

/** Weekly completion rate of a habit in 0..100 (capped at the target). */
export function habitWeekRate(habit: Habit, logs: readonly HabitLog[], weekStart: DateKey): number {
  const target = habit.frequency === 'daily' ? 7 : habit.targetPerWeek
  const done = Math.min(target, completedInWeek(habit.id, logs, weekStart))
  return Math.round((done / target) * 100)
}

/** Streak value at the end of each given day (0 on inactive days) — used for the streak history chart. */
export function streakSeries(activeDays: ReadonlySet<DateKey>, days: readonly DateKey[]): Array<{ date: DateKey; streak: number }> {
  return days.map((date) => {
    let count = 0
    let cursor = date
    while (activeDays.has(cursor)) {
      count++
      cursor = addDaysKey(cursor, -1)
    }
    return { date, streak: count }
  })
}

/** Longest run of consecutive active days in the whole history. */
export function longestStreak(activeDays: ReadonlySet<DateKey>): number {
  let best = 0
  for (const day of activeDays) {
    if (activeDays.has(addDaysKey(day, -1))) continue // only start counting at the beginning of a run
    let length = 0
    let cursor = day
    while (activeDays.has(cursor)) {
      length++
      cursor = addDaysKey(cursor, 1)
    }
    best = Math.max(best, length)
  }
  return best
}
