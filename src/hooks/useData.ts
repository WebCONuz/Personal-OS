import { useEffect, useMemo, useState } from 'react'
import { useDb } from '@/data/store'
import type { DbState } from '@/data/schema/db'
import { todayKey, type DateKey } from '@/services/date'

/** Subscribes to one collection. Components read through hooks; they never touch storage. */
export function useCollection<K extends keyof DbState>(name: K): DbState[K] {
  return useDb((s) => s.data[name])
}

export function useDbState(): DbState {
  return useDb((s) => s.data)
}

export function useProfile() {
  return useDb((s) => s.data.profile)
}

export function useMeta() {
  return useDb((s) => s.meta)
}

/** Whether the browser granted persistent storage; null while unknown or unsupported. */
export function useDurableStorage() {
  return useDb((s) => s.durable)
}

export function useLifeAreas(opts: { activeOnly?: boolean } = {}) {
  const areas = useDb((s) => s.data.lifeAreas)
  return useMemo(() => {
    const sorted = [...areas].sort((a, b) => a.sortOrder - b.sortOrder)
    return opts.activeOnly ? sorted.filter((a) => a.isActive) : sorted
  }, [areas, opts.activeOnly])
}

/** Current local date key; refreshes every minute so the UI rolls over at midnight. */
export function useToday(): DateKey {
  const [today, setToday] = useState(() => todayKey())
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = todayKey()
      setToday((prev) => (prev === next ? prev : next))
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])
  return today
}

/** Ticking timestamp for live displays (e.g. running timer). Display only — never used as source of truth. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, enabled])
  return now
}
