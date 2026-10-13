import { repos, type NewEntity } from '@/data/repositories'
import { addDaysKey, diffDays, type DateKey } from '@/services/date'
import type { FamilyEvent, HealthLog } from '@/types'

export type HealthInput = NewEntity<HealthLog>
export type FamilyInput = NewEntity<FamilyEvent>

export const healthService = {
  create: (input: HealthInput) => repos.healthLogs.create(input, { success: 'Ko‘rsatkich qayd etildi' }),
  update: (id: string, patch: Partial<HealthInput>) => repos.healthLogs.update(id, patch, { success: 'Yozuv yangilandi' }),
  remove: (id: string) => repos.healthLogs.remove(id, { success: 'Yozuv o‘chirildi' }),
}

export const familyService = {
  create: (input: FamilyInput) => repos.familyEvents.create(input, { success: 'Saqlandi' }),
  update: (id: string, patch: Partial<FamilyInput>, success = 'Yangilandi') => repos.familyEvents.update(id, patch, { success }),
  remove: (id: string) => repos.familyEvents.remove(id, { success: 'O‘chirildi' }),
}

/** Next occurrence of an event on or after `today` (yearly events roll over; Feb 29 falls back to Feb 28). */
export function nextOccurrence(event: Pick<FamilyEvent, 'date' | 'repeatsYearly'>, today: DateKey): DateKey {
  if (!event.repeatsYearly) return event.date
  const [, m, d] = event.date.split('-')
  const year = Number(today.slice(0, 4))
  for (const y of [year, year + 1]) {
    let candidate = `${y}-${m}-${d}`
    if (m === '02' && d === '29' && !isLeap(y)) candidate = `${y}-02-28`
    if (candidate >= today) return candidate
  }
  return addDaysKey(today, 365)
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

export function daysUntil(date: DateKey, today: DateKey): number {
  return diffDays(date, today)
}
