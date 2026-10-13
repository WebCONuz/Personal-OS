import type { TaskPriority } from '@/types'

/** All XP amounts live here — components never hardcode points. */
export const XP_RULES = {
  task: { low: 10, medium: 20, high: 30 } satisfies Record<TaskPriority, number>,
  habit: 5,
  milestone: 25,
  goal: 100,
  weeklyReview: 30,
  challenge: 40,
} as const

/** XP needed to *reach* level L is LEVEL_BASE * L * (L - 1) / 2 → 0, 100, 300, 600, 1000, ... */
export const LEVEL_BASE = 100
