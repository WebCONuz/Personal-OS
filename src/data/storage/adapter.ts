export type StorageErrorKind = 'quota' | 'unavailable' | 'unknown'

export class StorageError extends Error {
  readonly kind: StorageErrorKind

  constructor(kind: StorageErrorKind, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'StorageError'
    this.kind = kind
  }
}

/**
 * Minimal synchronous key-value storage contract. localStorage implements it today;
 * an IndexedDB-backed adapter (with an in-memory cache) could implement it later.
 */
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  keys(): string[]
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

export function createLocalStorageAdapter(storage: Storage | undefined = globalThis.localStorage): StorageAdapter {
  const get = (): Storage => {
    if (!storage) {
      throw new StorageError(
        'unavailable',
        'Brauzer xotirasi (localStorage) mavjud emas. Maxfiy rejim yoki brauzer sozlamalarini tekshiring.',
      )
    }
    return storage
  }
  return {
    getItem(key) {
      try {
        return get().getItem(key)
      } catch (error) {
        throw toStorageError(error)
      }
    },
    setItem(key, value) {
      try {
        get().setItem(key, value)
      } catch (error) {
        throw toStorageError(error)
      }
    },
    removeItem(key) {
      try {
        get().removeItem(key)
      } catch (error) {
        throw toStorageError(error)
      }
    },
    keys() {
      const s = get()
      const result: string[] = []
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i)
        if (k !== null) result.push(k)
      }
      return result
    },
  }
}

/** In-memory adapter used in tests and as a fallback when localStorage is unavailable. */
export function createMemoryAdapter(initial: Record<string, string> = {}): StorageAdapter & {
  dump(): Record<string, string>
} {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
    keys: () => [...map.keys()],
    dump: () => Object.fromEntries(map),
  }
}
