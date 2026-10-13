import type { z } from 'zod'
import { CURRENT_SCHEMA_VERSION, migrate, MigrationError, type RawCollections } from '../migrations'
import {
  COLLECTION_NAMES,
  isArrayCollection,
  arrayCollections,
  META_KEY,
  RECOVERY_PREFIX,
  schemaOf,
  storageKeyOf,
  STORAGE_PREFIX,
  type CollectionName,
  type DbState,
} from '../schema/db'
import { metaSchema } from '../schema/entities'
import { createDefaultState } from '../seed/defaults'
import { COLLECTION_LABELS } from '@/constants/labels'
import { StorageError, toStorageError, type StorageAdapter } from './adapter'

export type Meta = z.infer<typeof metaSchema>

export interface LoadIssue {
  collection: CollectionName | 'meta' | 'storage'
  kind: 'parse' | 'validation' | 'migration' | 'storage'
  message: string
  recoveryKey?: string
}

export interface LoadResult {
  data: DbState
  meta: Meta
  issues: LoadIssue[]
  /** When true, writes are refused so incompatible stored data is never overwritten. */
  writeBlocked: boolean
}

export function defaultMeta(): Meta {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, onboarded: false, demoLoaded: false }
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function saveRecovery(adapter: StorageAdapter, name: string, raw: string): string | undefined {
  const key = `${RECOVERY_PREFIX}${name}:${stamp()}`
  try {
    adapter.setItem(key, raw)
    return key
  } catch {
    return undefined
  }
}

export function loadState(adapter: StorageAdapter): LoadResult {
  const defaults = createDefaultState()
  const issues: LoadIssue[] = []

  // 1. Meta
  let meta = defaultMeta()
  let hasStoredMeta = false
  const rawMeta = adapter.getItem(META_KEY)
  if (rawMeta !== null) {
    try {
      const parsed = metaSchema.safeParse(JSON.parse(rawMeta))
      if (parsed.success) {
        meta = parsed.data
        hasStoredMeta = true
      } else {
        issues.push({ collection: 'meta', kind: 'validation', message: 'Meta ma’lumotlari buzilgan; standart qiymatlar ishlatildi.' })
      }
    } catch {
      issues.push({ collection: 'meta', kind: 'parse', message: 'Meta ma’lumotlari o‘qilmadi; standart qiymatlar ishlatildi.' })
    }
  }

  // 2. Raw collections
  const raw: RawCollections = {}
  const rawStrings: Partial<Record<CollectionName, string>> = {}
  for (const name of COLLECTION_NAMES) {
    const value = adapter.getItem(storageKeyOf(name))
    if (value === null) continue
    rawStrings[name] = value
    try {
      raw[name] = JSON.parse(value)
    } catch {
      const recoveryKey = saveRecovery(adapter, name, value)
      issues.push({
        collection: name,
        kind: 'parse',
        message: `“${COLLECTION_LABELS[name] ?? name}” ma’lumotlari buzilgan JSON. Asl nusxa zaxiraga olindi.`,
        recoveryKey,
      })
    }
  }

  // 3. Migrations
  let migrated = false
  if (hasStoredMeta && meta.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    try {
      if (meta.schemaVersion < CURRENT_SCHEMA_VERSION) {
        try {
          adapter.setItem(`${STORAGE_PREFIX}pre-migration-v${meta.schemaVersion}`, JSON.stringify(raw))
        } catch {
          // Backup is best effort; migration proceeds on the in-memory copy only.
        }
      }
      Object.assign(raw, migrate(raw, meta.schemaVersion))
      migrated = true
    } catch (error) {
      const message = error instanceof MigrationError ? error.message : 'Migratsiya muvaffaqiyatsiz tugadi.'
      issues.push({ collection: 'meta', kind: 'migration', message: `${message} Ma’lumotlar o‘zgartirilmadi.` })
      return { data: defaults, meta, issues, writeBlocked: true }
    }
  }

  // 4. Validation (salvage valid items, keep a recovery copy of the original)
  const data = { ...defaults } as Record<CollectionName, unknown>
  for (const name of COLLECTION_NAMES) {
    if (!(name in raw)) continue
    const value = raw[name]
    const parsed = schemaOf(name).safeParse(value)
    if (parsed.success) {
      data[name] = parsed.data
      continue
    }
    const original = rawStrings[name] ?? JSON.stringify(value)
    const recoveryKey = saveRecovery(adapter, name, original)
    if (isArrayCollection(name) && Array.isArray(value)) {
      const itemSchema = arrayCollections[name].item
      const valid: unknown[] = []
      for (const item of value) {
        const r = itemSchema.safeParse(item)
        if (r.success) valid.push(r.data)
      }
      data[name] = valid
      issues.push({
        collection: name,
        kind: 'validation',
        message: `“${COLLECTION_LABELS[name] ?? name}”: ${value.length - valid.length} ta noto‘g‘ri yozuv o‘tkazib yuborildi. Asl nusxa zaxiraga olindi.`,
        recoveryKey,
      })
    } else {
      issues.push({
        collection: name,
        kind: 'validation',
        message: `“${COLLECTION_LABELS[name] ?? name}” ma’lumotlari noto‘g‘ri formatda; standart qiymat ishlatildi. Asl nusxa zaxiraga olindi.`,
        recoveryKey,
      })
    }
  }

  const state = data as DbState

  if (migrated) {
    meta = { ...meta, schemaVersion: CURRENT_SCHEMA_VERSION }
    try {
      persistPatch(adapter, state)
      writeMeta(adapter, meta)
    } catch (error) {
      issues.push({ collection: 'storage', kind: 'storage', message: toStorageError(error).message })
    }
  }

  return { data: state, meta, issues, writeBlocked: false }
}

/**
 * Writes the given collections. If any write fails, previously written keys are restored
 * so a multi-collection operation is never left half-saved.
 */
export function persistPatch(adapter: StorageAdapter, patch: Partial<DbState>): void {
  const written: Array<{ key: string; previous: string | null }> = []
  try {
    for (const name of Object.keys(patch) as CollectionName[]) {
      const key = storageKeyOf(name)
      const previous = adapter.getItem(key)
      const next = JSON.stringify(patch[name])
      adapter.setItem(key, next)
      written.push({ key, previous })
    }
  } catch (error) {
    for (const { key, previous } of written.reverse()) {
      try {
        if (previous === null) adapter.removeItem(key)
        else adapter.setItem(key, previous)
      } catch {
        // Rollback is best effort; the in-memory state remains the previous valid state.
      }
    }
    throw toStorageError(error)
  }
}

export function writeMeta(adapter: StorageAdapter, meta: Meta): void {
  adapter.setItem(META_KEY, JSON.stringify(meta))
}

export function listRecoveryKeys(adapter: StorageAdapter): string[] {
  try {
    return adapter.keys().filter((k) => k.startsWith(RECOVERY_PREFIX) || k.startsWith(`${STORAGE_PREFIX}pre-migration-`))
  } catch {
    return []
  }
}

/** Approximate bytes used by this app's keys (UTF-16 → 2 bytes per char). */
export function estimateUsageBytes(adapter: StorageAdapter): number {
  try {
    let total = 0
    for (const key of adapter.keys()) {
      if (!key.startsWith(STORAGE_PREFIX)) continue
      total += (key.length + (adapter.getItem(key)?.length ?? 0)) * 2
    }
    return total
  } catch {
    return 0
  }
}

export function clearAppStorage(adapter: StorageAdapter, opts: { keepRecovery?: boolean } = {}): void {
  for (const key of adapter.keys()) {
    if (!key.startsWith(STORAGE_PREFIX)) continue
    if (opts.keepRecovery && key.startsWith(RECOVERY_PREFIX)) continue
    adapter.removeItem(key)
  }
}

export { StorageError }
