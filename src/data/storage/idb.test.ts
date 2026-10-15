import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushWrites, getDb, initDb, useDb } from '@/data/store'
import { goalService } from '@/features/goals/service'
import { goal } from '@/test/factories'
import { META_KEY, RECOVERY_PREFIX, storageKeyOf } from '../schema/db'
import { StorageError } from './adapter'
import { createIdbAdapter } from './idb'
import { importLegacyLocalStorage } from './legacy'

/** Minimal Storage (Node 25 ships an experimental global localStorage that shadows jsdom's). */
function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
  }
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('IndexedDB adapter', () => {
  it('keeps data after the database is reopened', async () => {
    const first = await createIdbAdapter()
    await first.write([
      { key: 'personal-os:goals', value: '[1]' },
      { key: 'personal-os:tasks', value: '[2]' },
    ])
    await first.write([{ key: 'personal-os:tasks', value: null }])

    const reopened = await createIdbAdapter()
    expect(reopened.getItem('personal-os:goals')).toBe('[1]')
    expect(reopened.getItem('personal-os:tasks')).toBeNull()
  })

  it('writes a batch atomically: a failing change leaves nothing behind', async () => {
    const adapter = await createIdbAdapter()
    await expect(
      adapter.write([
        { key: 'personal-os:goals', value: '[1]' },
        { key: undefined as unknown as string, value: 'invalid key' },
      ]),
    ).rejects.toBeInstanceOf(StorageError)
    expect(adapter.getItem('personal-os:goals')).toBeNull()
    expect((await createIdbAdapter()).getItem('personal-os:goals')).toBeNull()
  })
})

describe('moving data from localStorage', () => {
  it('moves data keys once, keeps a recovery copy and leaves UI prefs alone', async () => {
    localStorage.setItem(storageKeyOf('goals'), '[]')
    localStorage.setItem(META_KEY, '{"schemaVersion":1}')
    localStorage.setItem('personal-os:ui', '{"sidebarCollapsed":true}')

    const adapter = await createIdbAdapter()
    expect(await importLegacyLocalStorage(adapter)).toBe(2)
    expect(adapter.getItem(storageKeyOf('goals'))).toBe('[]')
    const recovery = adapter.keys().find((k) => k.startsWith(RECOVERY_PREFIX))!
    expect(JSON.parse(adapter.getItem(recovery)!)).toEqual({ [storageKeyOf('goals')]: '[]', [META_KEY]: '{"schemaVersion":1}' })
    expect(localStorage.getItem(storageKeyOf('goals'))).toBeNull()
    expect(localStorage.getItem('personal-os:ui')).not.toBeNull()

    // Never imported again once the database has data.
    localStorage.setItem(storageKeyOf('goals'), '[]')
    expect(await importLegacyLocalStorage(adapter)).toBe(0)
  })

  it('starts the app from the moved data and saves new changes to IndexedDB', async () => {
    localStorage.setItem(storageKeyOf('goals'), JSON.stringify([goal({ id: 'old', title: 'Eski maqsad' })]))

    await initDb()
    expect(useDb.getState().persistent).toBe(true)
    expect(getDb().goals.map((g) => g.title)).toEqual(['Eski maqsad'])

    goalService.create({ title: 'Yangi maqsad', description: '', status: 'active', metricType: 'completion', currentValue: 0 })
    await flushWrites()
    const stored = JSON.parse((await createIdbAdapter()).getItem(storageKeyOf('goals'))!) as Array<{ title: string }>
    expect(stored.map((g) => g.title)).toEqual(['Eski maqsad', 'Yangi maqsad'])
  })
})
