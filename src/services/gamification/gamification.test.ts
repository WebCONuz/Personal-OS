import { describe, expect, it } from 'vitest'
import { habit } from '@/test/factories'
import type { HabitLog, XpEvent } from '@/types'
import { activityStreak, consecutiveDays, habitStreak, habitWeekRate, longestStreak, streakSeries } from './streak'
import { awardOnce, levelFromXp, totalXp, xpForLevel } from './xp'

const T = '2026-10-01T10:00:00.000Z'
const log = (habitId: string, date: string, completed = true): HabitLog => ({ id: `${habitId}-${date}`, habitId, date, completed, createdAt: T, updatedAt: T })

describe('levels', () => {
  it('follows 0, 100, 300, 600, 1000 thresholds', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000])
  })

  it('derives level and progress from total XP', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, progressXp: 0, spanXp: 100, percent: 0 })
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(450)).toMatchObject({ level: 3, progressXp: 150, spanXp: 300, percent: 50 })
    expect(levelFromXp(-50).level).toBe(1)
  })
})

describe('XP awards', () => {
  it('awards a source only once', () => {
    let events: XpEvent[] = []
    const first = awardOnce(events, { sourceType: 'task', sourceId: 't1', points: 20, reason: 'x' })
    expect(first.awarded).toBe(true)
    events = first.events
    const second = awardOnce(events, { sourceType: 'task', sourceId: 't1', points: 20, reason: 'x' })
    expect(second.awarded).toBe(false)
    expect(second.events).toHaveLength(1)
    expect(totalXp(second.events)).toBe(20)
  })

  it('treats different source types independently', () => {
    const a = awardOnce([], { sourceType: 'task', sourceId: 'same', points: 10, reason: 'x' })
    const b = awardOnce(a.events, { sourceType: 'milestone', sourceId: 'same', points: 25, reason: 'y' })
    expect(b.awarded).toBe(true)
    expect(totalXp(b.events)).toBe(35)
  })
})

describe('streaks', () => {
  it('does not break when today has no activity yet', () => {
    const days = new Set(['2026-10-10', '2026-10-11', '2026-10-12'])
    expect(consecutiveDays(days, '2026-10-13')).toBe(3)
    expect(consecutiveDays(new Set([...days, '2026-10-13']), '2026-10-13')).toBe(4)
  })

  it('breaks after a fully missed day', () => {
    expect(consecutiveDays(new Set(['2026-10-10', '2026-10-11']), '2026-10-13')).toBe(0)
  })

  it('counts completed tasks and habits as activity', () => {
    const tasks = [{ id: 't', title: 't', description: '', status: 'done' as const, priority: 'low' as const, completedAt: new Date(2026, 9, 12, 15).toISOString(), createdAt: T, updatedAt: T }]
    expect(activityStreak(tasks, [log('h', '2026-10-11')], '2026-10-13')).toBe(2)
  })

  it('computes weekly habit streaks by target, not by consecutive days', () => {
    const h = habit({ id: 'walk', frequency: 'weekly', targetPerWeek: 2 })
    const logs = [
      log('walk', '2026-09-29'),
      log('walk', '2026-10-02'), // week of 28 Sep: 2 ✓
      log('walk', '2026-10-06'),
      log('walk', '2026-10-09'), // week of 5 Oct: 2 ✓
      log('walk', '2026-10-13'), // current week: 1 (in progress)
    ]
    expect(habitStreak(h, logs, '2026-10-14')).toBe(2)
    expect(habitWeekRate(h, logs, '2026-10-12')).toBe(50)
  })

  it('ignores unchecked logs', () => {
    const h = habit({ id: 'en' })
    expect(habitStreak(h, [log('en', '2026-10-12', false), log('en', '2026-10-11')], '2026-10-13')).toBe(0)
  })
})

describe('streak history', () => {
  it('computes the streak value at the end of each day', () => {
    const active = new Set(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06'])
    const series = streakSeries(active, ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06'])
    expect(series.map((p) => p.streak)).toEqual([2, 3, 0, 1, 2])
    expect(longestStreak(active)).toBe(3)
    expect(longestStreak(new Set())).toBe(0)
  })
})
