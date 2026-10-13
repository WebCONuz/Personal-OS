import { createId, nowIso } from '@/lib/id'
import { notify } from '@/lib/notify'
import { mutate } from '@/data/mutate'
import { repos, type NewEntity } from '@/data/repositories'
import { getDb } from '@/data/store'
import { isoToDateKey } from '@/services/date'
import type { ActiveTimer, TimeEntry } from '@/types'

export const MAX_ENTRY_MINUTES = 1440

/**
 * Elapsed time is always derived from the stored `startedAt` timestamp, so closing the browser
 * or sleeping the device never corrupts the timer. UI intervals are display-only.
 */
export function elapsedMinutes(timer: Pick<ActiveTimer, 'startedAt'>, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(timer.startedAt).getTime()) / 60000))
}

function entryFromTimer(timer: ActiveTimer, now: Date): TimeEntry | null {
  const minutes = elapsedMinutes(timer, now.getTime())
  if (minutes < 1) return null
  const stamp = now.toISOString()
  return {
    id: createId(),
    taskId: timer.taskId,
    projectId: timer.projectId,
    learningItemId: timer.learningItemId,
    lifeAreaId: timer.lifeAreaId,
    note: timer.note,
    date: isoToDateKey(timer.startedAt),
    startedAt: timer.startedAt,
    endedAt: stamp,
    durationMinutes: Math.min(minutes, MAX_ENTRY_MINUTES),
    source: 'timer',
    createdAt: stamp,
    updatedAt: stamp,
  }
}

function clean<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')) as T
}

export const timerService = {
  /** Only one timer may run. Starting a new one stops and saves the current one first. */
  start(target: Omit<ActiveTimer, 'startedAt'>) {
    const previous = getDb().timer
    let savedPrevious = false
    const ok = mutate((state) => {
      const patch: Partial<typeof state> = { timer: clean({ ...target, startedAt: nowIso() }) }
      if (state.timer) {
        const entry = entryFromTimer(state.timer, new Date())
        if (entry) {
          patch.timeEntries = [...state.timeEntries, clean(entry)]
          savedPrevious = true
        }
      }
      return patch
    })
    if (ok) {
      notify.info(previous ? (savedPrevious ? 'Oldingi taymer saqlandi, yangisi boshlandi' : 'Yangi taymer boshlandi') : 'Taymer boshlandi')
    }
    return ok
  },

  stop() {
    const timer = getDb().timer
    if (!timer) return false
    const entry = entryFromTimer(timer, new Date())
    const ok = mutate((state) => ({
      timer: null,
      ...(entry ? { timeEntries: [...state.timeEntries, clean(entry)] } : {}),
    }))
    if (!ok) return false
    if (!entry) notify.info('1 daqiqadan qisqa vaqt saqlanmadi')
    else if (elapsedMinutes(timer) > 12 * 60) notify.warning('Taymer 12 soatdan ortiq ishladi — yozuvni tekshirib chiqing')
    else notify.success(`${entry.durationMinutes} daqiqa qayd etildi`)
    return true
  },

  cancel() {
    return mutate(() => ({ timer: null }), { success: 'Taymer bekor qilindi' })
  },
}

export type TimeEntryInput = NewEntity<TimeEntry>

export const timeEntryService = {
  create(input: TimeEntryInput) {
    return repos.timeEntries.create(input, { success: 'Vaqt qayd etildi' })
  },
  update(id: string, patch: Partial<TimeEntryInput>) {
    return repos.timeEntries.update(id, patch, { success: 'Yozuv yangilandi' })
  },
  remove(id: string) {
    return repos.timeEntries.remove(id, { success: 'Yozuv o‘chirildi' })
  },
}
