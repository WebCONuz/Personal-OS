import { useMemo } from 'react'
import { useCollection, useProfile } from '@/hooks/useData'
import { capacityInfo, plannedMinutes, tasksOfWeek, weekCompletion } from '@/services/analytics'
import type { DateKey } from '@/services/date'

/** Everything derived for one week — plan, tasks, completion and capacity — computed from base data. */
export function useWeekOverview(weekStart: DateKey) {
  const plans = useCollection('weeklyPlans')
  const tasks = useCollection('tasks')
  const profile = useProfile()
  return useMemo(() => {
    const plan = plans.find((p) => p.weekStart === weekStart)
    const weekTasks = tasksOfWeek(tasks, weekStart)
    const capacity = capacityInfo(
      plannedMinutes(weekTasks),
      plan?.capacityMinutes ?? profile.weeklyCapacityMinutes,
      plan?.bufferPercent ?? profile.bufferPercent,
    )
    return { plan, tasks: weekTasks, completion: weekCompletion(tasks, weekStart), capacity }
  }, [plans, tasks, profile, weekStart])
}
