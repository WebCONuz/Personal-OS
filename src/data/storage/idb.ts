import { openDB, type DBSchema } from 'idb'
import { applyChanges, StorageError, toStorageError, type StorageAdapter } from './adapter'

/*
 * One object store of string values keyed exactly like the former localStorage keys
 * (`personal-os:goals`, …). Keeping the key-value shape means loading, validation, recovery
 * copies and migrations work unchanged; IndexedDB adds a far larger quota and real
 * multi-key transactions.
 */
export const IDB_NAME = 'personal-os'
const IDB_VERSION = 1
const STORE = 'kv'

interface PersonalOsDb extends DBSchema {
  kv: { key: string; value: string }
}

/** Opens the database and loads every entry into memory, so reads stay synchronous. */
export async function createIdbAdapter(): Promise<StorageAdapter> {
  if (!globalThis.indexedDB) {
    throw new StorageError('unavailable', 'Brauzerda IndexedDB mavjud emas. Maxfiy rejim yoki brauzer sozlamalarini tekshiring.')
  }
  try {
    const db = await openDB<PersonalOsDb>(IDB_NAME, IDB_VERSION, {
      upgrade(database) {
        database.createObjectStore(STORE)
      },
    })
    const cache = new Map<string, string>()
    let cursor = await db.transaction(STORE).store.openCursor()
    while (cursor) {
      cache.set(cursor.key, cursor.value)
      cursor = await cursor.continue()
    }

    return {
      getItem: (key) => cache.get(key) ?? null,
      keys: () => [...cache.keys()],
      async write(changes) {
        if (changes.length === 0) return
        const tx = db.transaction(STORE, 'readwrite')
        // Every request joins `pending`, so a failure anywhere rejects here, not as an unhandled promise.
        const pending: Promise<unknown>[] = [tx.done]
        try {
          for (const { key, value } of changes) pending.push(value === null ? tx.store.delete(key) : tx.store.put(value, key))
        } catch (error) {
          // A request rejected synchronously: abort so nothing from this batch is committed.
          tx.abort()
          await Promise.allSettled(pending)
          throw toStorageError(error)
        }
        try {
          await Promise.all(pending)
        } catch (error) {
          throw toStorageError(error)
        }
        applyChanges(cache, changes)
      },
    }
  } catch (error) {
    throw toStorageError(error)
  }
}
