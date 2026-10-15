import { create } from 'zustand'
import { notify } from '@/lib/notify'
import { createMemoryAdapter, StorageError, toStorageError, type StorageAdapter, type StorageChange } from './storage/adapter'
import { createIdbAdapter } from './storage/idb'
import { importLegacyLocalStorage, readLegacyLocalStorage } from './storage/legacy'
import {
  clearChanges,
  defaultMeta,
  loadState,
  metaChange,
  patchChanges,
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
  /** False when IndexedDB is unavailable and data lives only in memory for this tab. */
  persistent: boolean
  /** Whether the browser granted persistent storage (`navigator.storage.persist()`); null = unknown. */
  durable: boolean | null
  /** Saves still running in the background. */
  pendingWrites: number
  lastSavedAt: string | null
  /**
   * Updates state immediately and saves in the background. If saving fails, state is rolled back
   * to the last saved version and the user sees a toast. Throws only when writes are blocked.
   */
  commit: (patch: Partial<DbState>) => void
  updateMeta: (patch: Partial<Meta>) => void
  /** Replaces all collections and meta in one atomic save (import / demo / onboarding). */
  replaceAll: (data: DbState, meta?: Partial<Meta>) => void
  resetAll: () => void
  dismissIssue: (index: number) => void
}

type Snapshot = Pick<DbStore, 'data' | 'meta'>

let adapter: StorageAdapter = createMemoryAdapter()
/** Last state known to be saved — the rollback target. */
let confirmed: Snapshot
/** Saves run strictly one after another, in the order the changes were made. */
let queue: Promise<void> = Promise.resolve()
/** Bumped when the store is (re)loaded; saves queued for an older load are dropped. */
let epoch = 0
/** Bumped on a failed save; saves queued after it were built on the rolled-back state and are dropped. */
let generation = 0

const UNAVAILABLE_MESSAGE = 'Brauzer xotirasi mavjud emas: ma’lumotlar faqat shu oynada saqlanadi va yopilganda yo‘qoladi.'

function initialState(a: StorageAdapter, persistent: boolean, extraIssues: LoadIssue[] = []) {
  adapter = a
  epoch++
  const result = loadState(a)
  const issues = [...extraIssues, ...result.issues]
  if (!persistent && extraIssues.length === 0) issues.unshift({ collection: 'storage', kind: 'storage', message: UNAVAILABLE_MESSAGE })
  confirmed = { data: result.data, meta: result.meta }
  return {
    state: {
      data: result.data,
      meta: result.meta,
      issues,
      writeBlocked: result.writeBlocked,
      persistent,
      durable: null,
      pendingWrites: 0,
      lastSavedAt: null,
    },
    writes: result.writes,
  }
}

function blockedError(): StorageError {
  return new StorageError(
    'unavailable',
    'Saqlangan ma’lumotlar ushbu versiya bilan mos emas, shuning uchun o‘zgarishlar saqlanmaydi. Sozlamalardan zaxira nusxani ko‘ring.',
  )
}

/** Queues a background save of the current state. Changes may be computed when the save runs. */
function persist(changes: StorageChange[] | ((a: StorageAdapter) => StorageChange[])) {
  const job = { epoch, generation, adapter }
  const { data, meta } = useDb.getState()
  const snapshot: Snapshot = { data, meta }
  const current = () => job.epoch === epoch
  useDb.setState((s) => ({ pendingWrites: s.pendingWrites + 1 }))
  queue = queue.then(async () => {
    try {
      if (!current() || job.generation !== generation) return
      await job.adapter.write(typeof changes === 'function' ? changes(job.adapter) : changes)
      if (!current()) return
      confirmed = snapshot
      useDb.setState({ lastSavedAt: new Date().toISOString() })
    } catch (error) {
      if (!current()) return
      generation++
      useDb.setState({ data: confirmed.data, meta: confirmed.meta })
      notify.error('Saqlab bo‘lmadi — so‘nggi o‘zgarishlar bekor qilindi', toStorageError(error).message)
    } finally {
      if (current()) useDb.setState((s) => ({ pendingWrites: Math.max(0, s.pendingWrites - 1) }))
    }
  })
}

export const useDb = create<DbStore>()((set, get) => ({
  ...initialState(adapter, true).state,

  commit: (patch) => {
    if (get().writeBlocked) throw blockedError()
    if (Object.keys(patch).length === 0) return
    set((s) => ({ data: { ...s.data, ...patch } }))
    persist(patchChanges(patch))
  },

  updateMeta: (patch) => {
    if (get().writeBlocked) throw blockedError()
    const meta = { ...get().meta, ...patch }
    set({ meta })
    persist([metaChange(meta)])
  },

  replaceAll: (data, metaPatch = {}) => {
    if (get().writeBlocked) throw blockedError()
    const meta = { ...get().meta, ...metaPatch }
    set({ data, meta })
    persist([...patchChanges(data), metaChange(meta)])
  },

  resetAll: () => {
    set({ data: createDefaultState(), meta: defaultMeta(), writeBlocked: false, issues: [], lastSavedAt: null })
    persist((a) => clearChanges(a, { keepRecovery: true }))
  },

  dismissIssue: (index) => set((s) => ({ issues: s.issues.filter((_, i) => i !== index) })),
}))

export function getDb(): DbState {
  return useDb.getState().data
}

export function getStorageAdapter(): StorageAdapter {
  return adapter
}

/** Resolves when every queued save has finished (successfully or not). */
export function flushWrites(): Promise<void> {
  return queue
}

/** Loads the store from the given adapter (app start, tests). Load-time writes are queued. */
export function reloadDb(a: StorageAdapter, persistent = true, issues: LoadIssue[] = []): void {
  const { state, writes } = initialState(a, persistent, issues)
  useDb.setState(state)
  if (writes.length) persist(writes)
}

/**
 * Opens IndexedDB, moves data from older localStorage-based versions once, and loads the store.
 * Never throws: without IndexedDB the app runs on an in-memory copy and shows a banner.
 */
export async function initDb(): Promise<void> {
  let a: StorageAdapter
  let persistent = true
  const issues: LoadIssue[] = []
  try {
    a = await createIdbAdapter()
    try {
      await importLegacyLocalStorage(a)
    } catch (error) {
      // The old data stays in localStorage for the next attempt; this tab works on a copy of it.
      a = createMemoryAdapter(readLegacyLocalStorage())
      persistent = false
      issues.push({
        collection: 'storage',
        kind: 'storage',
        message: `Ma’lumotlarni yangi xotiraga (IndexedDB) ko‘chirib bo‘lmadi: ${toStorageError(error).message} Eski ma’lumotlar joyida qoldi; bu oynadagi o‘zgarishlar saqlanmaydi.`,
      })
    }
  } catch {
    a = createMemoryAdapter(readLegacyLocalStorage())
    persistent = false
  }
  reloadDb(a, persistent, issues)
  await flushWrites()
  if (!persistent) return
  window.addEventListener('beforeunload', (event) => {
    // Asks "Leave site?" only while a save is still running.
    if (useDb.getState().pendingWrites > 0) event.preventDefault()
  })
  void requestDurableStorage()
}

/** Asks the browser not to evict our data under storage pressure. Not awaited: Firefox may prompt. */
async function requestDurableStorage() {
  const storage = globalThis.navigator?.storage
  if (!storage?.persist) return
  try {
    const durable = (await storage.persisted()) || (await storage.persist())
    useDb.setState({ durable })
  } catch {
    // Unsupported: stays unknown.
  }
}
