import { createId, nowIso } from '@/lib/id'
import type { XpEvent } from '@/types'
import { LEVEL_BASE } from './config'

export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level))
  return (LEVEL_BASE * l * (l - 1)) / 2
}

export interface LevelInfo {
  level: number
  totalXp: number
  currentLevelXp: number
  nextLevelXp: number
  /** XP earned inside the current level. */
  progressXp: number
  /** XP span of the current level. */
  spanXp: number
  percent: number
}

export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp))
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const spanXp = nextLevelXp - currentLevelXp
  const progressXp = xp - currentLevelXp
  return {
    level,
    totalXp: xp,
    currentLevelXp,
    nextLevelXp,
    progressXp,
    spanXp,
    percent: Math.round((progressXp / spanXp) * 100),
  }
}

export function totalXp(events: readonly XpEvent[]): number {
  return events.reduce((sum, e) => sum + e.points, 0)
}

export function hasXpFor(events: readonly XpEvent[], sourceType: XpEvent['sourceType'], sourceId: string): boolean {
  return events.some((e) => e.sourceType === sourceType && e.sourceId === sourceId)
}

/**
 * Returns the events list with a new award appended, or the same list if this source was already
 * rewarded. XP is granted only on the *first* successful completion; reopening keeps history intact.
 */
export function awardOnce(
  events: readonly XpEvent[],
  award: { sourceType: XpEvent['sourceType']; sourceId: string; points: number; reason: string },
): { events: XpEvent[]; awarded: boolean } {
  if (hasXpFor(events, award.sourceType, award.sourceId)) {
    return { events: events as XpEvent[], awarded: false }
  }
  const event: XpEvent = { id: createId(), createdAt: nowIso(), ...award }
  return { events: [...events, event], awarded: true }
}

export function habitXpSourceId(habitId: string, date: string): string {
  return `${habitId}:${date}`
}
