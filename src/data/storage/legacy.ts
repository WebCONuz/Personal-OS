import { isDataKey, RECOVERY_PREFIX } from '../schema/db'
import type { StorageAdapter, StorageChange } from './adapter'

/** Data keys saved by older versions in localStorage (UI prefs and the theme hint are not data). */
export function readLegacyLocalStorage(storage: Storage | undefined = globalThis.localStorage): Record<string, string> {
  const entries: Record<string, string> = {}
  try {
    if (!storage) return entries
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key === null || !isDataKey(key)) continue
      const value = storage.getItem(key)
      if (value !== null) entries[key] = value
    }
  } catch {
    // localStorage blocked: nothing to import.
  }
  return entries
}

/**
 * One-time move of data saved by older versions (localStorage) into the database.
 * Runs only while the database holds no data yet. The full original is also stored as a
 * recovery copy, and localStorage is cleared only after the database write has committed —
 * so a failure leaves the old data in place for the next attempt, and a later "reset all"
 * can never resurrect it.
 * Returns the number of moved keys.
 */
export async function importLegacyLocalStorage(adapter: StorageAdapter, storage: Storage | undefined = globalThis.localStorage): Promise<number> {
  if (!storage || adapter.keys().some(isDataKey)) return 0
  const entries = readLegacyLocalStorage(storage)
  const keys = Object.keys(entries)
  if (keys.length === 0) return 0

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const changes: StorageChange[] = [
    ...keys.map((key) => ({ key, value: entries[key] })),
    { key: `${RECOVERY_PREFIX}localStorage:${stamp}`, value: JSON.stringify(entries) },
  ]
  await adapter.write(changes)
  for (const key of keys) {
    try {
      storage.removeItem(key)
    } catch {
      // Harmless: the database already has data, so this copy is never imported again.
    }
  }
  return keys.length
}
