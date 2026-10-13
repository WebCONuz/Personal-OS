import { describe, expect, it } from 'vitest'
import { emptyState, goal, task, transaction } from '@/test/factories'
import type { Budget } from '@/types'
import { budgetUsage, capacityInfo, computeInsights, isInbox, isOverdue, isUnplanned, learningMinutes, monthlyFinance, tasksForDay, tasksOfWeek, weekCompletion } from './index'

const T = '2026-10-01T10:00:00.000Z'

describe('weekly tasks', () => {
  it('includes tasks planned for the week or scheduled inside it', () => {
    const tasks = [
      task({ id: 'a', weekStart: '2026-10-12' }),
      task({ id: 'b', scheduledDate: '2026-10-15' }),
      task({ id: 'c', weekStart: '2026-10-05' }),
      task({ id: 'd' }),
    ]
    expect(tasksOfWeek(tasks, '2026-10-12').map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('computes completion only for that week and without cancelled tasks', () => {
    const tasks = [
      task({ weekStart: '2026-10-12', status: 'done' }),
      task({ weekStart: '2026-10-12', status: 'cancelled' }),
      task({ weekStart: '2026-10-12' }),
      task({ weekStart: '2026-10-05', status: 'done' }),
    ]
    expect(weekCompletion(tasks, '2026-10-12')).toEqual({ done: 1, total: 2, percent: 50 })
  })

  it('flags overplanning against capacity minus buffer', () => {
    const info = capacityInfo(500, 600, 20)
    expect(info.plannable).toBe(480)
    expect(info.isOverplanned).toBe(true)
    expect(info.overBy).toBe(20)
    expect(capacityInfo(400, 600, 20).isOverplanned).toBe(false)
  })

  it('detects overdue tasks without counting done ones', () => {
    expect(isOverdue(task({ dueDate: '2026-10-10' }), '2026-10-13')).toBe(true)
    expect(isOverdue(task({ dueDate: '2026-10-10', status: 'done' }), '2026-10-13')).toBe(false)
    expect(isOverdue(task({ dueDate: '2026-10-13' }), '2026-10-13')).toBe(false)
  })

  it('shows tasks completed today in the day agenda', () => {
    const completedToday = new Date(2026, 9, 13, 18).toISOString()
    const tasks = [task({ id: 'x', status: 'done', completedAt: completedToday }), task({ id: 'y', scheduledDate: '2026-10-13' }), task({ id: 'z', scheduledDate: '2026-10-13', status: 'cancelled' })]
    expect(tasksForDay(tasks, '2026-10-13').map((t) => t.id).sort()).toEqual(['x', 'y'])
  })
})

describe('finance', () => {
  const txs = [
    transaction({ type: 'income', amount: 10_000_000, currency: 'UZS', date: '2026-10-05' }),
    transaction({ type: 'expense', amount: 3_000_000, currency: 'UZS', date: '2026-10-06', category: 'Oziq-ovqat' }),
    transaction({ type: 'expense', amount: 40, currency: 'USD', date: '2026-10-07', category: 'Dasturiy ta’minot' }),
    transaction({ type: 'expense', amount: 999, currency: 'UZS', date: '2026-09-30' }),
  ]

  it('totals each currency separately for the month', () => {
    const m = monthlyFinance(txs, '2026-10')
    expect(m.income).toEqual({ UZS: 10_000_000, USD: 0 })
    expect(m.expense).toEqual({ UZS: 3_000_000, USD: 40 })
    expect(m.net).toEqual({ UZS: 7_000_000, USD: -40 })
  })

  it('compares budgets with spending in the same currency only', () => {
    const budgets: Budget[] = [
      { id: 'b1', category: 'Oziq-ovqat', amount: 2_500_000, currency: 'UZS', createdAt: T, updatedAt: T },
      { id: 'b2', category: 'Dasturiy ta’minot', amount: 50, currency: 'USD', createdAt: T, updatedAt: T },
    ]
    const [food, software] = budgetUsage(budgets, txs, '2026-10')
    expect(food).toMatchObject({ spent: 3_000_000, exceeded: true, percent: 120 })
    expect(software).toMatchObject({ spent: 40, exceeded: false, remaining: 10 })
  })
})

describe('insights', () => {
  it('does not draw conclusions without enough data', () => {
    expect(computeInsights(emptyState(), '2026-10-13')).toEqual([])
  })

  it('reports a goal without movement for 14+ days', () => {
    const state = { ...emptyState(), goals: [goal({ id: 'g', title: 'Kitob', createdAt: '2026-09-01T10:00:00.000Z' })] }
    const insights = computeInsights(state, '2026-10-13')
    expect(insights.map((i) => i.id)).toContain('stalled-g')
  })

  it('reports exceeded budgets', () => {
    const state = {
      ...emptyState(),
      budgets: [{ id: 'b', category: 'Transport', amount: 100, currency: 'UZS' as const, createdAt: T, updatedAt: T }],
      transactions: [transaction({ category: 'Transport', amount: 150, date: '2026-10-02' })],
    }
    expect(computeInsights(state, '2026-10-13').map((i) => i.id)).toContain('budget-b')
  })
})

describe('planning helpers', () => {
  it('treats open tasks without week or day as unplanned, even with a due date', () => {
    const withDue = task({ dueDate: '2026-10-20' })
    expect(isUnplanned(withDue)).toBe(true)
    expect(isInbox(withDue)).toBe(false)
    expect(isUnplanned(task({ weekStart: '2026-10-12' }))).toBe(false)
    expect(isUnplanned(task({ status: 'done' }))).toBe(false)
  })

  it('counts learning time from direct entries and from learning-session tasks', () => {
    const session = task({ id: 'session', learningItemId: 'book' })
    const entry = (id: string, extra: object) => ({ id, date: '2026-10-10', durationMinutes: 30, source: 'manual' as const, createdAt: T, updatedAt: T, ...extra })
    const entries = [entry('a', { learningItemId: 'book' }), entry('b', { taskId: 'session' }), entry('c', { taskId: 'other' })]
    expect(learningMinutes('book', entries, [session])).toBe(60)
  })
})
