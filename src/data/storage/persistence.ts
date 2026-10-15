import type { z } from 'zod'
import { CURRENT_SCHEMA_VERSION, migrate, MigrationError, type RawCollections } from '../migrations'
import {
  COLLECTION_NAMES,
  isArrayCollection,
  arrayCollections,
  META_KEY,
  PRE_MIGRATION_PREFIX,
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
import { StorageError, type StorageAdapter, type StorageChange } from './adapter'

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
  /** Recovery copies and migrated data to save after loading (one batch). */
  writes: StorageChange[]
}

export function defaultMeta(): Meta {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, onboarded: false, demoLoaded: false }
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

/**
 * Reads and validates everything from the adapter's snapshot. Loading itself never writes:
 * recovery copies and migrated data are returned in `writes` for the store to save.
 */
export function loadState(adapter: StorageAdapter): LoadResult {
  const defaults = createDefaultState()
  const issues: LoadIssue[] = []
  const writes: StorageChange[] = []
  const saveRecovery = (name: string, raw: string): string => {
    const key = `${RECOVERY_PREFIX}${name}:${stamp()}`
    writes.push({ key, value: raw })
    return key
  }

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
      const recoveryKey = saveRecovery(name, value)
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
        writes.push({ key: `${PRE_MIGRATION_PREFIX}v${meta.schemaVersion}`, value: JSON.stringify(raw) })
      }
      Object.assign(raw, migrate(raw, meta.schemaVersion))
      migrated = true
    } catch (error) {
      const message = error instanceof MigrationError ? error.message : 'Migratsiya muvaffaqiyatsiz tugadi.'
      issues.push({ collection: 'meta', kind: 'migration', message: `${message} Ma’lumotlar o‘zgartirilmadi.` })
      return { data: defaults, meta, issues, writeBlocked: true, writes }
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
    const recoveryKey = saveRecovery(name, original)
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
    writes.push(...patchChanges(state), metaChange(meta))
  }

  return { data: state, meta, issues, writeBlocked: false, writes }
}

export function patchChanges(patch: Partial<DbState>): StorageChange[] {
  return (Object.keys(patch) as CollectionName[]).map((name) => ({ key: storageKeyOf(name), value: JSON.stringify(patch[name]) }))
}

export function metaChange(meta: Meta): StorageChange {
  return { key: META_KEY, value: JSON.stringify(meta) }
}

/** Saves the given collections in one atomic batch: either all of them are written or none. */
export function persistPatch(adapter: StorageAdapter, patch: Partial<DbState>): Promise<void> {
  return adapter.write(patchChanges(patch))
}

export function writeMeta(adapter: StorageAdapter, meta: Meta): Promise<void> {
  return adapter.write([metaChange(meta)])
}

export function listRecoveryKeys(adapter: StorageAdapter): string[] {
  try {
    return adapter.keys().filter((k) => k.startsWith(RECOVERY_PREFIX) || k.startsWith(PRE_MIGRATION_PREFIX))
  } catch {
    return []
  }
}

/** Approximate bytes used by this app's keys (strings are UTF-16 → 2 bytes per char). */
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

/** Removal batch for every app key (recovery copies optionally kept). */
export function clearChanges(adapter: StorageAdapter, opts: { keepRecovery?: boolean } = {}): StorageChange[] {
  const keys = new Set([META_KEY, ...COLLECTION_NAMES.map(storageKeyOf), ...adapter.keys()])
  return [...keys]
    .filter((key) => key.startsWith(STORAGE_PREFIX) && !(opts.keepRecovery && key.startsWith(RECOVERY_PREFIX)))
    .map((key) => ({ key, value: null }))
}

export { StorageError }
