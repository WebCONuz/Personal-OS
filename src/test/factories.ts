import { createDefaultState } from '@/data/seed/defaults'
import type { DbState, Goal, Habit, Milestone, Task, Transaction } from '@/types'

const T = '2026-10-01T10:00:00.000Z'
let seq = 0
const id = (p: string) => `${p}-${++seq}`

export function emptyState(): DbState {
  return createDefaultState(T)
}

export function task(overrides: Partial<Task> = {}): Task {
  return { id: id('task'), title: 'Vazifa', description: '', status: 'todo', priority: 'medium', createdAt: T, updatedAt: T, ...overrides }
}

export function goal(overrides: Partial<Goal> = {}): Goal {
  return { id: id('goal'), title: 'Maqsad', description: '', status: 'active', metricType: 'numeric', targetValue: 100, currentValue: 0, createdAt: T, updatedAt: T, ...overrides }
}

export function milestone(overrides: Partial<Milestone> = {}): Milestone {
  return { id: id('ms'), title: 'Bosqich', status: 'todo', sortOrder: 0, createdAt: T, updatedAt: T, ...overrides }
}

export function habit(overrides: Partial<Habit> = {}): Habit {
  return { id: id('habit'), title: 'Odat', frequency: 'daily', targetPerWeek: 7, active: true, createdAt: T, updatedAt: T, ...overrides }
}

export function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return { id: id('tx'), type: 'expense', amount: 1000, currency: 'UZS', category: 'Oziq-ovqat', date: '2026-10-05', createdAt: T, updatedAt: T, ...overrides }
}
