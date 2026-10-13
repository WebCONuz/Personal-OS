import { useMemo } from 'react'
import { useDbState, useToday } from '@/hooks/useData'
import { computeBadges } from '@/services/gamification/badges'
import { activityStreak } from '@/services/gamification/streak'
import { levelFromXp, totalXp } from '@/services/gamification/xp'

export function useGamification() {
  const state = useDbState()
  const today = useToday()
  return useMemo(
    () => ({
      enabled: state.profile.gamificationEnabled,
      level: levelFromXp(totalXp(state.xpEvents)),
      streak: activityStreak(state.tasks, state.habitLogs, today),
      badges: computeBadges(state, today),
    }),
    [state, today],
  )
}
