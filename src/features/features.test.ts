import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryAdapter } from '@/data/storage/adapter'
import { getDb, reloadDb, useDb } from '@/data/store'
import { goalService, milestoneService } from '@/features/goals/service'
import { habitService } from '@/features/habits/service'
import { savingsService } from '@/features/finance/service'
import { taskService } from '@/features/tasks/service'
import { timerService } from '@/features/time-tracking/service'
import { weeklyPlanService } from '@/features/weekly-planning/service'
import { XP_RULES } from '@/services/gamification/config'

beforeEach(() => {
  reloadDb(createMemoryAdapter())
})

afterEach(() => {
  vi.useRealTimers()
})

describe('task workflow', () => {
  it('grants XP only on the first completion and keeps it when reopened', () => {
    const t = taskService.create({ title: 'Yozish', description: '', status: 'todo', priority: 'high' }, { silent: true })!
    taskService.setStatus(t.id, 'done')
    expect(getDb().xpEvents).toHaveLength(1)
    expect(getDb().xpEvents[0].points).toBe(XP_RULES.task.high)
    expect(getDb().tasks[0].completedAt).toBeDefined()

    taskService.setStatus(t.id, 'todo')
    expect(getDb().tasks[0].completedAt).toBeUndefined()
    expect(getDb().xpEvents).toHaveLength(1)

    taskService.setStatus(t.id, 'done')
    expect(getDb().xpEvents).toHaveLength(1)
  })

  it('keeps a scheduled day inside its planned week', () => {
    const t = taskService.create({ title: 'x', description: '', status: 'todo', priority: 'low', scheduledDate: '2026-10-15' }, { silent: true })!
    expect(t.weekStart).toBe('2026-10-12')
    taskService.planForWeek(t.id, '2026-10-19')
    const moved = getDb().tasks[0]
    expect(moved.weekStart).toBe('2026-10-19')
    expect(moved.scheduledDate).toBeUndefined()
  })

  it('moves only open tasks to the next week, and only when asked', () => {
    const a = taskService.create({ title: 'a', description: '', status: 'todo', priority: 'low', weekStart: '2026-10-05' }, { silent: true })!
    const b = taskService.create({ title: 'b', description: '', status: 'todo', priority: 'low', weekStart: '2026-10-05' }, { silent: true })!
    taskService.setStatus(b.id, 'done')
    taskService.moveOpenToNextWeek([a.id, b.id], '2026-10-05')
    const byId = Object.fromEntries(getDb().tasks.map((t) => [t.id, t]))
    expect(byId[a.id].weekStart).toBe('2026-10-12')
    expect(byId[b.id].weekStart).toBe('2026-10-05')
  })

  it('persists to storage so data survives a reload', () => {
    const adapter = createMemoryAdapter()
    reloadDb(adapter)
    taskService.create({ title: 'Saqlanadi', description: '', status: 'todo', priority: 'medium' }, { silent: true })
    reloadDb(adapter)
    expect(getDb().tasks.map((t) => t.title)).toEqual(['Saqlanadi'])
  })

  it('leaves state untouched when storage fails', () => {
    const adapter = createMemoryAdapter()
    reloadDb({ ...adapter, setItem: () => { throw new DOMException('full', 'QuotaExceededError') } })
    const result = taskService.create({ title: 'x', description: '', status: 'todo', priority: 'low' }, { silent: true })
    expect(result).toBeNull()
    expect(useDb.getState().data.tasks).toEqual([])
  })
})

describe('goals', () => {
  it('records progress history and rejects invalid values', () => {
    goalService.create({ title: 'Kitob', description: '', status: 'active', metricType: 'numeric', targetValue: 12, currentValue: 2 })
    const g = getDb().goals[0]
    expect(getDb().goalProgress.map((p) => p.value)).toEqual([2])
    goalService.logProgress(g.id, 5)
    expect(getDb().goals[0].currentValue).toBe(5)
    expect(getDb().goalProgress.map((p) => p.value)).toEqual([2, 5])
    expect(goalService.logProgress(g.id, -1)).toBe(false)
    goalService.removeProgress(getDb().goalProgress[1].id)
    expect(getDb().goals[0].currentValue).toBe(2)
  })

  it('awards milestone XP once even when toggled repeatedly', () => {
    goalService.create({ title: 'G', description: '', status: 'active', metricType: 'milestone', currentValue: 0 })
    const m = milestoneService.create({ goalId: getDb().goals[0].id, title: 'M' })!
    milestoneService.toggle(m.id)
    milestoneService.toggle(m.id)
    milestoneService.toggle(m.id)
    expect(getDb().xpEvents.filter((e) => e.sourceType === 'milestone')).toHaveLength(1)
    expect(getDb().milestones[0].status).toBe('done')
  })
})

describe('habits', () => {
  it('never creates duplicate logs for the same day and awards XP once', () => {
    const h = habitService.create({ title: 'Ingliz tili', frequency: 'daily', targetPerWeek: 7, active: true })!
    habitService.setLog(h.id, '2026-10-13', true)
    habitService.setLog(h.id, '2026-10-13', false)
    habitService.setLog(h.id, '2026-10-13', true)
    expect(getDb().habitLogs).toHaveLength(1)
    expect(getDb().habitLogs[0].completed).toBe(true)
    expect(getDb().xpEvents).toHaveLength(1)
  })
})

describe('weekly plan', () => {
  it('starts as a draft and moves through its lifecycle', () => {
    weeklyPlanService.create('2026-10-12')
    expect(getDb().weeklyPlans[0].status).toBe('draft')
    weeklyPlanService.setStatus('2026-10-12', 'active')
    weeklyPlanService.setStatus('2026-10-12', 'completed')
    expect(getDb().weeklyPlans[0].status).toBe('completed')
  })

  it('limits priorities to five', () => {
    for (let i = 0; i < 6; i++) weeklyPlanService.addPriority('2026-10-12', `P${i}`)
    expect(getDb().weeklyPlans[0].priorities).toHaveLength(5)
  })

  it('awards the challenge XP once per week', () => {
    weeklyPlanService.setChallenge('2026-10-12', 'Har kuni yurish')
    weeklyPlanService.toggleChallenge('2026-10-12')
    weeklyPlanService.toggleChallenge('2026-10-12')
    weeklyPlanService.toggleChallenge('2026-10-12')
    expect(getDb().xpEvents.filter((e) => e.sourceType === 'challenge')).toHaveLength(1)
  })
})

describe('timer', () => {
  it('derives duration from startedAt, so closing the tab does not lose time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 13, 9, 0))
    timerService.start({ note: 'Fokus' })
    // Simulate a reload while the timer is running.
    vi.setSystemTime(new Date(2026, 9, 13, 10, 30))
    timerService.stop()
    expect(getDb().timer).toBeNull()
    expect(getDb().timeEntries[0]).toMatchObject({ durationMinutes: 90, date: '2026-10-13', source: 'timer' })
  })

  it('saves the running timer when another one is started', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 13, 9, 0))
    timerService.start({ note: 'Birinchi' })
    vi.setSystemTime(new Date(2026, 9, 13, 9, 20))
    timerService.start({ note: 'Ikkinchi' })
    expect(getDb().timeEntries).toHaveLength(1)
    expect(getDb().timeEntries[0].durationMinutes).toBe(20)
    expect(getDb().timer?.note).toBe('Ikkinchi')
  })
})

describe('savings', () => {
  it('does not allow withdrawing more than the saved balance', () => {
    const g = savingsService.create({ title: 'Uy', targetAmount: 1000, currency: 'UZS', status: 'active' })!
    savingsService.addContribution({ savingsGoalId: g.id, type: 'deposit', amount: 300, date: '2026-10-01' })
    expect(savingsService.addContribution({ savingsGoalId: g.id, type: 'withdrawal', amount: 500, date: '2026-10-02' })).toBeNull()
    expect(getDb().savingsContributions).toHaveLength(1)
  })
})
