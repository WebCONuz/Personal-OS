import type { Goal, Milestone, Task } from '@/types'

export function percent(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}

export interface CompletionStats {
  done: number
  total: number
  percent: number
}

/** Task completion ignoring cancelled tasks (they are not part of the denominator). */
export function taskCompletion(tasks: readonly Task[]): CompletionStats {
  const relevant = tasks.filter((t) => t.status !== 'cancelled')
  const done = relevant.filter((t) => t.status === 'done').length
  return { done, total: relevant.length, percent: percent(done, relevant.length) }
}

export function milestoneCompletion(milestones: readonly Milestone[]): CompletionStats {
  const done = milestones.filter((m) => m.status === 'done').length
  return { done, total: milestones.length, percent: percent(done, milestones.length) }
}

/** Goal progress in 0..100 according to its metric type. */
export function goalProgressPercent(goal: Goal, milestones: readonly Milestone[]): number {
  if (goal.status === 'completed') return 100
  switch (goal.metricType) {
    case 'completion':
      return 0
    case 'percent':
      return Math.max(0, Math.min(100, Math.round(goal.currentValue)))
    case 'numeric':
      return goal.targetValue ? percent(goal.currentValue, goal.targetValue) : 0
    case 'milestone':
      return milestoneCompletion(milestones.filter((m) => m.goalId === goal.id)).percent
  }
}

/** Validates a progress value for a goal's metric type; returns an error message or null. */
export function validateProgressValue(goal: Pick<Goal, 'metricType' | 'targetValue'>, value: number): string | null {
  if (!Number.isFinite(value) || value < 0) return 'Qiymat manfiy bo‘lmagan son bo‘lishi kerak.'
  if (goal.metricType === 'percent' && value > 100) return 'Foiz 0 dan 100 gacha bo‘lishi kerak.'
  if (goal.metricType === 'numeric' && !goal.targetValue) return 'Avval maqsad qiymatini belgilang.'
  return null
}

export function nextMilestone(milestones: readonly Milestone[]): Milestone | undefined {
  return [...milestones]
    .filter((m) => m.status !== 'done')
    .sort((a, b) => (a.targetDate ?? '9999').localeCompare(b.targetDate ?? '9999') || a.sortOrder - b.sortOrder)[0]
}
