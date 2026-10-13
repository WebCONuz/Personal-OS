import { notify } from '@/lib/notify'
import { StorageError, toStorageError } from './storage/adapter'
import type { DbState } from './schema/db'
import { useDb } from './store'

export interface MutateOptions {
  /** Toast shown after a successful save. */
  success?: string
}

/**
 * Runs a pure recipe against the current state and commits the returned patch atomically.
 * Storage errors are never swallowed: the user sees a toast and the UI state stays unchanged.
 * Returns true when the change was saved.
 */
export function mutate(recipe: (state: DbState) => Partial<DbState> | null | undefined, opts: MutateOptions = {}): boolean {
  const store = useDb.getState()
  let patch: Partial<DbState> | null | undefined
  try {
    patch = recipe(store.data)
  } catch (error) {
    notify.error('Amalni bajarib bo‘lmadi', error instanceof Error ? error.message : undefined)
    return false
  }
  if (!patch) return false
  try {
    store.commit(patch)
    if (opts.success) notify.success(opts.success)
    return true
  } catch (error) {
    const e = error instanceof StorageError ? error : toStorageError(error)
    notify.error('Saqlab bo‘lmadi', e.message)
    return false
  }
}
