import { create } from 'zustand'
import { createLocalStorageAdapter, createMemoryAdapter, StorageError, type StorageAdapter } from './storage/adapter'
import {
  clearAppStorage,
  defaultMeta,
  loadState,
  persistPatch,
  writeMeta,
  type LoadIssue,
  type Meta,
} from './storage/persistence'
import type { DbState } from './schema/db'
import { createDefaultState } from './seed/defaults'

export interface DbStore {
  data: DbState
  meta: Meta
  issues: LoadIssue[]
  writeBlocked: boolean
  /** False when localStorage is unavailable and data lives only in memory for this tab. */
  persistent: boolean
  lastSavedAt: string | null
  /** Persists the patch first, then updates state. Throws StorageError on failure (state unchanged). */
  commit: (patch: Partial<DbState>) => void
  updateMeta: (patch: Partial<Meta>) => void
  /** Replaces all collections atomically (import / reset). */
  replaceAll: (data: DbState, meta?: Partial<Meta>) => void
  resetAll: () => void
  dismissIssue: (index: number) => void
}

let adapter: StorageAdapter

function resolveAdapter(): { adapter: StorageAdapter; persistent: boolean } {
  try {
    const ls = createLocalStorageAdapter()
    const probe = '__personal-os-probe__'
    ls.setItem(probe, '1')
    ls.removeItem(probe)
    return { adapter: ls, persistent: true }
  } catch {
    return { adapter: createMemoryAdapter(), persistent: false }
  }
}

function initialState(a: StorageAdapter, persistent: boolean) {
  adapter = a
  const result = loadState(a)
  const issues = [...result.issues]
  if (!persistent) {
    issues.unshift({
      collection: 'storage',
      kind: 'storage',
      message: 'Brauzer xotirasi mavjud emas: ma’lumotlar faqat shu oynada saqlanadi va yopilganda yo‘qoladi.',
    })
  }
  return {
    data: result.data,
    meta: result.meta,
    issues,
    writeBlocked: result.writeBlocked,
    persistent,
    lastSavedAt: null,
  }
}

function blockedError(): StorageError {
  return new StorageError(
    'unavailable',
    'Saqlangan ma’lumotlar ushbu versiya bilan mos emas, shuning uchun o‘zgarishlar saqlanmaydi. Sozlamalardan zaxira nusxani ko‘ring.',
  )
}

const resolved = resolveAdapter()

export const useDb = create<DbStore>()((set, get) => ({
  ...initialState(resolved.adapter, resolved.persistent),

  commit: (patch) => {
    if (get().writeBlocked) throw blockedError()
    if (Object.keys(patch).length === 0) return
    persistPatch(adapter, patch)
    set((s) => ({ data: { ...s.data, ...patch }, lastSavedAt: new Date().toISOString() }))
  },

  updateMeta: (patch) => {
    if (get().writeBlocked) throw blockedError()
    const meta = { ...get().meta, ...patch }
    writeMeta(adapter, meta)
    set({ meta })
  },

  replaceAll: (data, metaPatch = {}) => {
    if (get().writeBlocked) throw blockedError()
    persistPatch(adapter, data)
    const meta = { ...get().meta, ...metaPatch }
    writeMeta(adapter, meta)
    set({ data, meta, lastSavedAt: new Date().toISOString() })
  },

  resetAll: () => {
    clearAppStorage(adapter, { keepRecovery: true })
    set({ data: createDefaultState(), meta: defaultMeta(), writeBlocked: false, issues: [], lastSavedAt: null })
  },

  dismissIssue: (index) => set((s) => ({ issues: s.issues.filter((_, i) => i !== index) })),
}))

export function getDb(): DbState {
  return useDb.getState().data
}

export function getStorageAdapter(): StorageAdapter {
  return adapter
}

/** Test helper: reloads the store from the given adapter. */
export function reloadDb(a: StorageAdapter, persistent = true): void {
  useDb.setState(initialState(a, persistent))
}
