import { createId, nowIso } from '@/lib/id'
import { notify } from '@/lib/notify'
import { mutate } from '@/data/mutate'
import { removeEntities } from '@/data/relations'
import { repos, type NewEntity } from '@/data/repositories'
import { getDb } from '@/data/store'
import { todayKey, type DateKey } from '@/services/date'
import { XP_RULES } from '@/services/gamification/config'
import { awardOnce } from '@/services/gamification/xp'
import { validateProgressValue } from '@/services/progress'
import type { Goal, GoalStatus, Milestone } from '@/types'

export type GoalInput = NewEntity<Goal>
export type MilestoneInput = NewEntity<Milestone>

function xpSuffix(points: number): string {
  return getDb().profile.gamificationEnabled && points > 0 ? ` · +${points} XP` : ''
}

/** Removes metric fields that do not apply to the chosen metric type. */
function normalizeGoal<T extends Partial<GoalInput>>(goal: T): T {
  if (goal.metricType === 'completion' || goal.metricType === 'milestone') {
    return { ...goal, targetValue: undefined, unit: undefined }
  }
  if (goal.metricType === 'percent') return { ...goal, targetValue: 100, unit: '%' }
  return goal
}

export const goalService = {
  create(input: GoalInput) {
    const data = normalizeGoal(input)
    return mutate(
      (state) => {
        const goal = repos.goals.build(data)
        const patch = repos.goals.withCreated(state, goal)
        // The initial value becomes the first point of the progress history.
        if (goal.currentValue > 0 && (goal.metricType === 'numeric' || goal.metricType === 'percent')) {
          const now = nowIso()
          patch.goalProgress = [
            ...state.goalProgress,
            { id: createId(), goalId: goal.id, value: goal.currentValue, date: todayKey(), note: 'Boshlang‘ich qiymat', createdAt: now, updatedAt: now },
          ]
        }
        return patch
      },
      { success: 'Maqsad yaratildi' },
    )
  },

  update(id: string, patch: Partial<GoalInput>) {
    const current = repos.goals.getById(id)
    if (!current) return false
    const { status, ...rest } = normalizeGoal({ metricType: current.metricType, ...patch })
    const ok = repos.goals.update(id, rest, { success: 'Maqsad yangilandi' })
    if (ok && status && status !== current.status) goalService.setStatus(id, status, { silent: true })
    return ok
  },

  setStatus(id: string, status: GoalStatus, opts: { silent?: boolean } = {}) {
    let awarded = 0
    const ok = mutate((state) => {
      const goal = state.goals.find((g) => g.id === id)
      if (!goal) throw new Error('Maqsad topilmadi')
      const completedAt = status === 'completed' ? (goal.completedAt ?? nowIso()) : undefined
      const patch = repos.goals.withUpdated(state, id, { status, completedAt })
      if (status !== 'completed') return patch
      const result = awardOnce(state.xpEvents, { sourceType: 'goal', sourceId: id, points: XP_RULES.goal, reason: `Maqsad: ${goal.title}` })
      if (result.awarded) awarded = XP_RULES.goal
      return { ...patch, xpEvents: result.events }
    })
    if (ok) {
      if (status === 'completed') notify.success(`Maqsad yakunlandi${xpSuffix(awarded)}`)
      else if (!opts.silent) notify.success('Holat yangilandi')
    }
    return ok
  },

  /** Appends a progress event (history) and updates the goal's current value in one commit. */
  logProgress(goalId: string, value: number, note?: string, date: DateKey = todayKey()) {
    const goal = repos.goals.getById(goalId)
    if (!goal) return false
    const error = validateProgressValue(goal, value)
    if (error) {
      notify.error('Progress saqlanmadi', error)
      return false
    }
    const ok = mutate(
      (state) => {
        const now = nowIso()
        return {
          ...repos.goals.withUpdated(state, goalId, { currentValue: value }),
          goalProgress: [...state.goalProgress, { id: createId(), goalId, value, note: note || undefined, date, createdAt: now, updatedAt: now }],
        }
      },
      { success: 'Progress qayd etildi' },
    )
    const reached = goal.metricType === 'percent' ? value >= 100 : goal.metricType === 'numeric' && !!goal.targetValue && value >= goal.targetValue
    if (ok && reached && goal.status !== 'completed') {
      notify.info('Maqsad qiymatiga yetdingiz. Maqsadni “Bajarilgan” deb belgilashingiz mumkin.')
    }
    return ok
  },

  removeProgress(id: string) {
    return mutate(
      (state) => {
        const event = state.goalProgress.find((p) => p.id === id)
        if (!event) return null
        const remaining = state.goalProgress.filter((p) => p.id !== id)
        const latest = remaining
          .filter((p) => p.goalId === event.goalId)
          .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
          .at(-1)
        return {
          goalProgress: remaining,
          ...repos.goals.withUpdated(state, event.goalId, { currentValue: latest?.value ?? 0 }),
        }
      },
      { success: 'Progress yozuvi o‘chirildi' },
    )
  },

  remove(id: string) {
    return mutate((s) => removeEntities(s, 'goals', [id]), { success: 'Maqsad o‘chirildi' })
  },
}

export const milestoneService = {
  create(input: Omit<MilestoneInput, 'status' | 'sortOrder'>) {
    const siblings = repos.milestones
      .getAll()
      .filter((m) => (input.goalId && m.goalId === input.goalId) || (input.projectId && m.projectId === input.projectId))
    return repos.milestones.create({ ...input, status: 'todo', sortOrder: siblings.length }, { success: 'Bosqich qo‘shildi' })
  },

  update(id: string, patch: Partial<MilestoneInput>) {
    return repos.milestones.update(id, patch, { success: 'Bosqich yangilandi' })
  },

  /** XP is granted once per milestone, on its first completion. */
  toggle(id: string) {
    let awarded = 0
    let nowDone = false
    const ok = mutate((state) => {
      const m = state.milestones.find((x) => x.id === id)
      if (!m) throw new Error('Bosqich topilmadi')
      nowDone = m.status !== 'done'
      const patch = repos.milestones.withUpdated(state, id, {
        status: nowDone ? 'done' : 'todo',
        completedAt: nowDone ? nowIso() : undefined,
      })
      if (!nowDone) return patch
      const result = awardOnce(state.xpEvents, { sourceType: 'milestone', sourceId: id, points: XP_RULES.milestone, reason: `Bosqich: ${m.title}` })
      if (result.awarded) awarded = XP_RULES.milestone
      return { ...patch, xpEvents: result.events }
    })
    if (ok && nowDone) notify.success(`Bosqich bajarildi${xpSuffix(awarded)}`)
    return ok
  },

  remove(id: string) {
    return repos.milestones.remove(id, { success: 'Bosqich o‘chirildi' })
  },
}
