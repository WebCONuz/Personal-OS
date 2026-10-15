export type StorageErrorKind = 'quota' | 'unavailable' | 'unknown'

export class StorageError extends Error {
  readonly kind: StorageErrorKind

  constructor(kind: StorageErrorKind, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'StorageError'
    this.kind = kind
  }
}

/** One key to write; `value: null` removes the key. */
export interface StorageChange {
  key: string
  value: string | null
}

/**
 * Key-value storage contract. Reads are synchronous from a snapshot loaded at startup, so the
 * store and services never await a read. Writes are applied as one atomic batch (all or nothing);
 * the snapshot changes only after the batch is committed.
 */
export interface StorageAdapter {
  getItem(key: string): string | null
  keys(): string[]
  write(changes: StorageChange[]): Promise<void>
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
}

export function toStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) return error
  if (isQuotaError(error)) {
    return new StorageError(
      'quota',
      'Brauzer xotirasi to‘lgan. Ma’lumotlarni eksport qiling va keraksiz yozuvlarni o‘chiring.',
      { cause: error },
    )
  }
  return new StorageError('unknown', 'Ma’lumotni saqlashda kutilmagan xatolik yuz berdi.', { cause: error })
}

/** Applies changes to an in-memory snapshot (shared by the memory and IndexedDB adapters). */
export function applyChanges(map: Map<string, string>, changes: StorageChange[]): void {
  for (const { key, value } of changes) {
    if (value === null) map.delete(key)
    else map.set(key, value)
  }
}

/** In-memory adapter used in tests and as a fallback when IndexedDB is unavailable. */
export function createMemoryAdapter(initial: Record<string, string> = {}): StorageAdapter & {
  dump(): Record<string, string>
} {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => map.get(key) ?? null,
    keys: () => [...map.keys()],
    write: async (changes) => applyChanges(map, changes),
    dump: () => Object.fromEntries(map),
  }
}
