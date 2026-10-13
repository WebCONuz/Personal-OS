import { useMemo } from 'react'
import { useCollection, useToday } from '@/hooks/useData'
import { formatNumber } from '@/services/money'
import { goalProgressPercent, milestoneCompletion, nextMilestone, taskCompletion, type CompletionStats } from '@/services/progress'
import type { Goal, Milestone } from '@/types'

export interface GoalSummary {
  goal: Goal
  progress: number
  milestones: CompletionStats
  tasks: CompletionStats
  next?: Milestone
  /** Target date passed while the goal is still open. */
  overdue: boolean
}

export function useGoalSummaries(): GoalSummary[] {
  const goals = useCollection('goals')
  const milestones = useCollection('milestones')
  const tasks = useCollection('tasks')
  const today = useToday()
  return useMemo(
    () =>
      goals.map((goal) => {
        const ms = milestones.filter((m) => m.goalId === goal.id)
        return {
          goal,
          progress: goalProgressPercent(goal, milestones),
          milestones: milestoneCompletion(ms),
          tasks: taskCompletion(tasks.filter((t) => t.goalId === goal.id)),
          next: nextMilestone(ms),
          overdue: !!goal.targetDate && goal.targetDate < today && (goal.status === 'active' || goal.status === 'planned'),
        }
      }),
    [goals, milestones, tasks, today],
  )
}

export function goalValueText(s: GoalSummary): string | null {
  const { goal } = s
  if (goal.metricType === 'numeric' && goal.targetValue) {
    return `${formatNumber(goal.currentValue)} / ${formatNumber(goal.targetValue)}${goal.unit ? ` ${goal.unit}` : ''}`
  }
  if (goal.metricType === 'milestone') return `${s.milestones.done} / ${s.milestones.total} bosqich`
  return null
}
