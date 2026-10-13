import { createId, nowIso } from '@/lib/id'
import { notify } from '@/lib/notify'
import { mutate } from '@/data/mutate'
import { removeEntities } from '@/data/relations'
import { repos, type NewEntity } from '@/data/repositories'
import { getDb } from '@/data/store'
import type { DateKey } from '@/services/date'
import { XP_RULES } from '@/services/gamification/config'
import { awardOnce, habitXpSourceId } from '@/services/gamification/xp'
import type { DbState, Habit } from '@/types'

export type HabitInput = NewEntity<Habit>

/**
 * Pure: sets the log for (habit, date) without ever creating a duplicate.
 * XP is granted only the first time that day is marked done (unchecking keeps history).
 */
export function applyHabitLog(state: DbState, habitId: string, date: DateKey, completed: boolean): { patch: Partial<DbState>; awarded: number } {
  const habit = state.habits.find((h) => h.id === habitId)
  if (!habit) throw new Error('Odat topilmadi')
  const now = nowIso()
  const existing = state.habitLogs.find((l) => l.habitId === habitId && l.date === date)
  const habitLogs = existing
    ? state.habitLogs.map((l) => (l.id === existing.id ? { ...l, completed, updatedAt: now } : l))
    : [...state.habitLogs, { id: createId(), habitId, date, completed, createdAt: now, updatedAt: now }]
  if (!completed) return { patch: { habitLogs }, awarded: 0 }
  const result = awardOnce(state.xpEvents, {
    sourceType: 'habit',
    sourceId: habitXpSourceId(habitId, date),
    points: XP_RULES.habit,
    reason: `Odat: ${habit.title}`,
  })
  return { patch: { habitLogs, xpEvents: result.events }, awarded: result.awarded ? XP_RULES.habit : 0 }
}

export const habitService = {
  create(input: HabitInput) {
    return repos.habits.create(normalize(input), { success: 'Odat qo‘shildi' })
  },
  update(id: string, patch: Partial<HabitInput>) {
    return repos.habits.update(id, normalize(patch), { success: 'Odat yangilandi' })
  },
  setActive(id: string, active: boolean) {
    return repos.habits.update(id, { active }, { success: active ? 'Odat faollashtirildi' : 'Odat arxivlandi' })
  },
  setLog(habitId: string, date: DateKey, completed: boolean) {
    let awarded = 0
    const ok = mutate((s) => {
      const r = applyHabitLog(s, habitId, date, completed)
      awarded = r.awarded
      return r.patch
    })
    if (ok && awarded && getDb().profile.gamificationEnabled) notify.success(`+${awarded} XP`)
    return ok
  },
  remove(id: string) {
    return mutate((s) => removeEntities(s, 'habits', [id]), { success: 'Odat va uning loglari o‘chirildi' })
  },
}

function normalize<T extends Partial<HabitInput>>(h: T): T {
  if (h.frequency === 'daily') return { ...h, targetPerWeek: 7 }
  return h
}
