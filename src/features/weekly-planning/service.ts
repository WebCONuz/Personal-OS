import { createId, nowIso } from '@/lib/id'
import { notify } from '@/lib/notify'
import { mutate } from '@/data/mutate'
import { repos } from '@/data/repositories'
import { getDb } from '@/data/store'
import { endOfWeekKey, startOfWeekKey, type DateKey } from '@/services/date'
import { XP_RULES } from '@/services/gamification/config'
import { awardOnce } from '@/services/gamification/xp'
import type { DbState, WeeklyPlan, WeeklyPriority } from '@/types'

export const MAX_PRIORITIES = 5

function newPlan(state: DbState, weekStart: DateKey): WeeklyPlan {
  const now = nowIso()
  const start = startOfWeekKey(weekStart)
  return {
    id: createId(),
    weekStart: start,
    weekEnd: endOfWeekKey(start),
    priorities: [],
    capacityMinutes: state.profile.weeklyCapacityMinutes,
    bufferPercent: state.profile.bufferPercent,
    // A new plan starts as a draft; the user activates it once priorities and tasks are chosen.
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }
}

function findPlan(state: DbState, weekStart: DateKey) {
  return state.weeklyPlans.find((p) => p.weekStart === startOfWeekKey(weekStart))
}

/** Applies `fn` to the plan of a week, creating the plan first if it does not exist. */
function withPlan(state: DbState, weekStart: DateKey, fn: (plan: WeeklyPlan) => WeeklyPlan): Partial<DbState> {
  const existing = findPlan(state, weekStart)
  const plan = existing ?? newPlan(state, weekStart)
  const updated = { ...fn(plan), updatedAt: nowIso() }
  return {
    weeklyPlans: existing ? state.weeklyPlans.map((p) => (p.id === plan.id ? updated : p)) : [...state.weeklyPlans, updated],
  }
}

export const weeklyPlanService = {
  create(weekStart: DateKey) {
    return mutate((s) => (findPlan(s, weekStart) ? null : withPlan(s, weekStart, (p) => p)), { success: 'Haftalik reja yaratildi' })
  },

  update(weekStart: DateKey, patch: Partial<Pick<WeeklyPlan, 'capacityMinutes' | 'bufferPercent' | 'notes' | 'status'>>, success = 'Reja yangilandi') {
    return mutate((s) => withPlan(s, weekStart, (p) => ({ ...p, ...patch })), { success })
  },

  setStatus(weekStart: DateKey, status: WeeklyPlan['status']) {
    const messages = { draft: 'Reja qoralamaga qaytarildi', active: 'Haftalik reja boshlandi', completed: 'Hafta yakunlandi' } as const
    return mutate((s) => withPlan(s, weekStart, (p) => ({ ...p, status })), { success: messages[status] })
  },

  addPriority(weekStart: DateKey, title: string, goalId?: string) {
    const plan = findPlan(getDb(), weekStart)
    if (plan && plan.priorities.length >= MAX_PRIORITIES) {
      notify.warning(`Haftada ${MAX_PRIORITIES} tadan ko‘p ustuvor natija tanlamaslik tavsiya etiladi`)
      return false
    }
    const priority: WeeklyPriority = { id: createId(), title: title.trim(), goalId: goalId || undefined, done: false }
    return mutate((s) => withPlan(s, weekStart, (p) => ({ ...p, priorities: [...p.priorities, priority] })), { success: 'Ustuvor natija qo‘shildi' })
  },

  /** Replaces priorities (used when a weekly review hands over next week's priorities). */
  setPriorities(weekStart: DateKey, titles: string[]) {
    const priorities = titles.slice(0, MAX_PRIORITIES).map((title) => ({ id: createId(), title, done: false }))
    return mutate((s) => withPlan(s, weekStart, (p) => ({ ...p, priorities })), { success: 'Keyingi hafta ustuvorliklari rejaga o‘tkazildi' })
  },

  togglePriority(weekStart: DateKey, priorityId: string) {
    return mutate((s) =>
      withPlan(s, weekStart, (p) => ({ ...p, priorities: p.priorities.map((x) => (x.id === priorityId ? { ...x, done: !x.done } : x)) })),
    )
  },

  removePriority(weekStart: DateKey, priorityId: string) {
    return mutate((s) => withPlan(s, weekStart, (p) => ({ ...p, priorities: p.priorities.filter((x) => x.id !== priorityId) })))
  },

  setChallenge(weekStart: DateKey, title: string) {
    return mutate((s) => withPlan(s, weekStart, (p) => ({ ...p, challenge: { title: title.trim(), done: false } })), { success: 'Haftalik challenge belgilandi' })
  },

  clearChallenge(weekStart: DateKey) {
    return mutate((s) => withPlan(s, weekStart, (p) => ({ ...p, challenge: undefined })))
  },

  /** XP for a challenge is granted once per weekly plan. */
  toggleChallenge(weekStart: DateKey) {
    let awarded = 0
    let done = false
    const ok = mutate((s) => {
      const patch = withPlan(s, weekStart, (p) => {
        if (!p.challenge) return p
        done = !p.challenge.done
        return { ...p, challenge: { ...p.challenge, done, completedAt: done ? nowIso() : undefined } }
      })
      const plan = patch.weeklyPlans!.find((p) => p.weekStart === startOfWeekKey(weekStart))!
      if (!done || !plan.challenge) return patch
      const result = awardOnce(s.xpEvents, { sourceType: 'challenge', sourceId: plan.id, points: XP_RULES.challenge, reason: `Challenge: ${plan.challenge.title}` })
      if (result.awarded) awarded = XP_RULES.challenge
      return { ...patch, xpEvents: result.events }
    })
    if (ok && done) notify.success(`Challenge bajarildi${getDb().profile.gamificationEnabled && awarded ? ` · +${awarded} XP` : ''}`)
    return ok
  },

  remove(id: string) {
    return repos.weeklyPlans.remove(id, { success: 'Reja o‘chirildi' })
  },
}
