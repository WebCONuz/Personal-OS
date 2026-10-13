import type { DbState } from '@/types'
import { activityStreak } from './streak'

export interface Badge {
  id: string
  title: string
  description: string
  earned: boolean
  /** Progress text such as "7 / 10". */
  progress?: string
}

/** Badges are derived from real data (never stored), so they always match history. */
export function computeBadges(state: DbState, today?: string): Badge[] {
  const doneTasks = state.tasks.filter((t) => t.status === 'done').length
  const completedGoals = state.goals.filter((g) => g.status === 'completed').length
  const weeklyReviews = state.reviews.filter((r) => r.periodType === 'weekly').length
  const habitDone = state.habitLogs.filter((l) => l.completed).length
  const streak = activityStreak(state.tasks, state.habitLogs, today)
  const achievements = state.achievements.length
  const savingsDeposits = state.savingsContributions.filter((c) => c.type === 'deposit').length

  const count = (value: number, target: number) => ({ earned: value >= target, progress: `${Math.min(value, target)} / ${target}` })

  return [
    { id: 'first-task', title: 'Birinchi qadam', description: 'Birinchi vazifani bajaring', ...count(doneTasks, 1) },
    { id: 'tasks-25', title: 'Izchil ijrochi', description: '25 ta vazifani bajaring', ...count(doneTasks, 25) },
    { id: 'tasks-100', title: 'Yuz qadam', description: '100 ta vazifani bajaring', ...count(doneTasks, 100) },
    { id: 'streak-7', title: 'Bir hafta ritmda', description: '7 kunlik faollik streaki', ...count(streak, 7) },
    { id: 'goal-done', title: 'Maqsadga yetdim', description: 'Birinchi maqsadni yakunlang', ...count(completedGoals, 1) },
    { id: 'review-4', title: 'Tahlilchi', description: '4 ta haftalik review yozing', ...count(weeklyReviews, 4) },
    { id: 'habit-30', title: 'Odat kuchi', description: 'Odatlarni 30 marta bajaring', ...count(habitDone, 30) },
    { id: 'evidence-3', title: 'Ko‘rinadigan natija', description: '3 ta karyera yutug‘ini qayd eting', ...count(achievements, 3) },
    { id: 'saver', title: 'Jamg‘aruvchi', description: 'Jamg‘armaga 5 marta hissa qo‘shing', ...count(savingsDeposits, 5) },
  ]
}
