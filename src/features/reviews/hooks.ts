import { useMemo } from 'react'
import { useDbState } from '@/hooks/useData'
import { entriesBetween, entryLifeAreaId, minutesByArea, tasksOfWeek, totalMinutes, weekCompletion } from '@/services/analytics'
import { endOfWeekKey, isoToDateKey, type DateKey } from '@/services/date'
import { habitWeekRate } from '@/services/gamification/streak'

/** Real statistics for a week, used to ground the weekly review (no invented recommendations). */
export function useWeekReviewStats(weekStart: DateKey) {
  const state = useDbState()
  return useMemo(() => {
    const weekEnd = endOfWeekKey(weekStart)
    const tasks = tasksOfWeek(state.tasks, weekStart)
    const entries = entriesBetween(state.timeEntries, weekStart, weekEnd)
    const plan = state.weeklyPlans.find((p) => p.weekStart === weekStart)
    const activeHabits = state.habits.filter((h) => h.active)
    const habitRate = activeHabits.length
      ? Math.round(activeHabits.reduce((s, h) => s + habitWeekRate(h, state.habitLogs, weekStart), 0) / activeHabits.length)
      : null
    const xp = state.xpEvents
      .filter((e) => {
        const d = isoToDateKey(e.createdAt)
        return d >= weekStart && d <= weekEnd
      })
      .reduce((s, e) => s + e.points, 0)

    // Areas with any recorded activity this week (done tasks, time, habits).
    const activeAreaIds = new Set<string>()
    for (const t of tasks) if (t.status === 'done' && t.lifeAreaId) activeAreaIds.add(t.lifeAreaId)
    for (const e of entries) {
      const id = entryLifeAreaId(e, state)
      if (id) activeAreaIds.add(id)
    }
    for (const log of state.habitLogs) {
      if (!log.completed || log.date < weekStart || log.date > weekEnd) continue
      const area = state.habits.find((h) => h.id === log.habitId)?.lifeAreaId
      if (area) activeAreaIds.add(area)
    }
    const quietAreas = state.lifeAreas.filter((a) => a.isActive && !activeAreaIds.has(a.id))

    return {
      completion: weekCompletion(state.tasks, weekStart),
      doneTasks: tasks.filter((t) => t.status === 'done'),
      openTasks: tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress'),
      priorities: plan?.priorities ?? [],
      minutes: totalMinutes(entries),
      byArea: minutesByArea(entries, state),
      habitRate,
      xp,
      quietAreas,
    }
  }, [state, weekStart])
}
