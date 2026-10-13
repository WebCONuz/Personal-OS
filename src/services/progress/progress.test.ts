import { describe, expect, it } from 'vitest'
import { goal, milestone, task } from '@/test/factories'
import { goalProgressPercent, nextMilestone, percent, taskCompletion, validateProgressValue } from './index'

describe('progress', () => {
  it('excludes cancelled tasks from the denominator', () => {
    const stats = taskCompletion([task({ status: 'done' }), task({ status: 'todo' }), task({ status: 'cancelled' }), task({ status: 'cancelled' })])
    expect(stats).toEqual({ done: 1, total: 2, percent: 50 })
  })

  it('returns 0% for an empty set instead of NaN', () => {
    expect(taskCompletion([]).percent).toBe(0)
    expect(percent(5, 0)).toBe(0)
  })

  it('computes goal progress per metric type', () => {
    expect(goalProgressPercent(goal({ metricType: 'numeric', targetValue: 300, currentValue: 75 }), [])).toBe(25)
    expect(goalProgressPercent(goal({ metricType: 'numeric', targetValue: 10, currentValue: 25 }), [])).toBe(100)
    expect(goalProgressPercent(goal({ metricType: 'percent', currentValue: 45 }), [])).toBe(45)
    expect(goalProgressPercent(goal({ metricType: 'completion' }), [])).toBe(0)
    expect(goalProgressPercent(goal({ metricType: 'completion', status: 'completed' }), [])).toBe(100)

    const g = goal({ metricType: 'milestone' })
    const ms = [milestone({ goalId: g.id, status: 'done' }), milestone({ goalId: g.id }), milestone({ goalId: g.id }), milestone({ goalId: 'other', status: 'done' })]
    expect(goalProgressPercent(g, ms)).toBe(33)
  })

  it('validates progress values for the metric', () => {
    expect(validateProgressValue({ metricType: 'percent' }, 120)).not.toBeNull()
    expect(validateProgressValue({ metricType: 'numeric', targetValue: 10 }, -1)).not.toBeNull()
    expect(validateProgressValue({ metricType: 'numeric', targetValue: 10 }, 15)).toBeNull()
    expect(validateProgressValue({ metricType: 'numeric' }, 5)).not.toBeNull()
  })

  it('picks the earliest open milestone as next', () => {
    const a = milestone({ title: 'A', targetDate: '2026-12-01' })
    const b = milestone({ title: 'B', targetDate: '2026-11-01' })
    const c = milestone({ title: 'C', status: 'done', targetDate: '2026-10-01' })
    expect(nextMilestone([a, b, c])?.title).toBe('B')
  })
})
