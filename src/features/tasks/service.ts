import { nowIso } from '@/lib/id'
import { notify } from '@/lib/notify'
import { mutate } from '@/data/mutate'
import { removeEntities } from '@/data/relations'
import { repos, type NewEntity } from '@/data/repositories'
import { getDb } from '@/data/store'
import { addDaysKey, startOfWeekKey, type DateKey } from '@/services/date'
import { XP_RULES } from '@/services/gamification/config'
import { awardOnce } from '@/services/gamification/xp'
import type { Task, TaskStatus } from '@/types'

export type TaskInput = NewEntity<Task>

/** Keeps planning fields consistent: a scheduled day always belongs to its week. */
export function normalizeTask<T extends Partial<Task>>(task: T): T {
  if (task.scheduledDate) {
    return { ...task, weekStart: startOfWeekKey(task.scheduledDate) }
  }
  return task
}

function xpToast(points: number) {
  if (getDb().profile.gamificationEnabled) notify.success(`Vazifa bajarildi · +${points} XP`)
  else notify.success('Vazifa bajarildi')
}

export const taskService = {
  create(input: TaskInput, opts: { silent?: boolean } = {}) {
    const data = normalizeTask(input)
    if (data.status === 'done') {
      // Created already done: go through status logic so XP and completedAt stay consistent.
      const created = repos.tasks.create({ ...data, status: 'todo' }, opts.silent ? {} : { success: 'Vazifa qo‘shildi' })
      if (created) taskService.setStatus(created.id, 'done')
      return created
    }
    return repos.tasks.create(data, opts.silent ? {} : { success: 'Vazifa qo‘shildi' })
  },

  update(id: string, patch: Partial<TaskInput>) {
    const current = repos.tasks.getById(id)
    if (!current) return false
    const { status, ...rest } = patch
    const ok = repos.tasks.update(id, normalizeTask(rest), { success: 'O‘zgarishlar saqlandi' })
    if (ok && status && status !== current.status) taskService.setStatus(id, status)
    return ok
  },

  /**
   * Status transitions. XP is granted only on the first completion of a task (tracked by XpEvent
   * source id). Reopening a done task clears completedAt but keeps the XP history untouched.
   */
  setStatus(id: string, status: TaskStatus) {
    let awarded = 0
    const ok = mutate((state) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task) throw new Error('Vazifa topilmadi')
      if (task.status === status) return null
      const completedAt = status === 'done' ? (task.completedAt ?? nowIso()) : undefined
      const tasksPatch = repos.tasks.withUpdated(state, id, { status, completedAt })
      if (status !== 'done') return tasksPatch
      const points = XP_RULES.task[task.priority]
      const result = awardOnce(state.xpEvents, { sourceType: 'task', sourceId: task.id, points, reason: `Vazifa: ${task.title}` })
      if (result.awarded) awarded = points
      return { ...tasksPatch, xpEvents: result.events }
    })
    if (ok && status === 'done') {
      if (awarded > 0) xpToast(awarded)
      else notify.success('Vazifa bajarildi')
    }
    return ok
  },

  toggleDone(task: Task) {
    return taskService.setStatus(task.id, task.status === 'done' ? 'todo' : 'done')
  },

  /** Plan into a week (or unplan with `undefined`). Clears the scheduled day if it falls outside. */
  planForWeek(id: string, weekStart: DateKey | undefined) {
    const task = repos.tasks.getById(id)
    if (!task) return false
    const keepDay = weekStart && task.scheduledDate && startOfWeekKey(task.scheduledDate) === weekStart
    return repos.tasks.update(
      id,
      { weekStart, scheduledDate: keepDay ? task.scheduledDate : undefined },
      { success: weekStart ? 'Haftalik rejaga qo‘shildi' : 'Rejadan chiqarildi' },
    )
  },

  scheduleOn(id: string, day: DateKey | undefined) {
    const task = repos.tasks.getById(id)
    if (!task) return false
    return repos.tasks.update(
      id,
      day ? { scheduledDate: day, weekStart: startOfWeekKey(day) } : { scheduledDate: undefined },
      { success: day ? 'Kunga belgilandi' : 'Kundan olib tashlandi' },
    )
  },

  planManyForWeek(ids: string[], weekStart: DateKey) {
    const set = new Set(ids)
    return mutate(
      (state) => {
        const now = nowIso()
        return { tasks: state.tasks.map((t) => (set.has(t.id) ? { ...t, weekStart, scheduledDate: undefined, updatedAt: now } : t)) }
      },
      { success: `${ids.length} ta vazifa rejaga qo‘shildi` },
    )
  },

  /** Explicit, user-initiated move of open tasks to the next week (never automatic). */
  moveOpenToNextWeek(ids: string[], fromWeek: DateKey) {
    const next = addDaysKey(fromWeek, 7)
    return mutate(
      (state) => {
        const set = new Set(ids)
        const now = nowIso()
        return {
          tasks: state.tasks.map((t) =>
            set.has(t.id) && (t.status === 'todo' || t.status === 'in_progress')
              ? { ...t, weekStart: next, scheduledDate: undefined, updatedAt: now }
              : t,
          ),
        }
      },
      { success: `${ids.length} ta vazifa keyingi haftaga ko‘chirildi` },
    )
  },

  quickCapture(title: string) {
    return repos.tasks.create(
      { title: title.trim(), description: '', status: 'todo', priority: 'medium' },
      { success: 'Inbox’ga qo‘shildi' },
    )
  },

  remove(id: string) {
    return mutate((s) => removeEntities(s, 'tasks', [id]), { success: 'Vazifa o‘chirildi' })
  },
}

export function defaultTaskInput(overrides: Partial<TaskInput> = {}): TaskInput {
  return { title: '', description: '', status: 'todo', priority: 'medium', ...overrides }
}

