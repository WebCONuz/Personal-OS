import { z } from 'zod'
import { CURRENT_SCHEMA_VERSION, migrate, MigrationError } from '@/data/migrations'
import { sanitizeReferences } from '@/data/relations'
import { arrayCollections, dbStateSchema, type ArrayCollectionName, type DbState } from '@/data/schema/db'
import { todayKey } from '@/services/date'

export const APP_NAME = 'personal-os'

export interface BackupFile {
  appName: typeof APP_NAME
  schemaVersion: number
  exportedAt: string
  collections: DbState
}

export function createBackup(state: DbState, now: Date = new Date()): BackupFile {
  // `state` is a single immutable snapshot from the store, so all collections are consistent.
  return {
    appName: APP_NAME,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    collections: state,
  }
}

export function backupFileName(now: Date = new Date()): string {
  return `personal-os-backup-${todayKey(now)}.json`
}

export function downloadJson(fileName: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(fileName, blob)
}

export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- Import ----------

export type ImportStrategy = 'merge' | 'replace'

export interface ImportPreview {
  exportedAt: string
  schemaVersion: number
  counts: Array<{ name: ArrayCollectionName; incoming: number; existing: number }>
  totalIncoming: number
  /** Number of dangling references that will be cleared/removed. */
  referenceFixes: number
  data: DbState
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

const envelopeSchema = z.object({
  appName: z.string(),
  schemaVersion: z.number().int(),
  exportedAt: z.string(),
  collections: z.record(z.string(), z.unknown()),
})

function formatIssues(error: z.ZodError): string {
  const first = error.issues.slice(0, 3).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
  const more = error.issues.length > 3 ? ` (+${error.issues.length - 3} ta)` : ''
  return first.join('; ') + more
}

/** Parses and validates a backup file. Never touches the current data. */
export function parseBackup(text: string, current: DbState): ImportPreview {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new ImportError('Fayl JSON formatida emas yoki buzilgan.')
  }

  const envelope = envelopeSchema.safeParse(json)
  if (!envelope.success) {
    throw new ImportError('Bu Personal OS zaxira fayli emas: appName, schemaVersion yoki collections topilmadi.')
  }
  if (envelope.data.appName !== APP_NAME) {
    throw new ImportError(`Fayl boshqa ilovaga tegishli (“${envelope.data.appName}”).`)
  }

  let raw = envelope.data.collections
  try {
    raw = migrate(raw, envelope.data.schemaVersion)
  } catch (error) {
    throw new ImportError(error instanceof MigrationError ? error.message : 'Faylni joriy versiyaga moslashtirib bo‘lmadi.')
  }

  const parsed = dbStateSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ImportError(`Fayldagi ma’lumotlar validatsiyadan o‘tmadi: ${formatIssues(parsed.error)}`)
  }

  const duplicate = findDuplicateIds(parsed.data)
  if (duplicate) {
    throw new ImportError(`“${duplicate}” to‘plamida takroriy ID mavjud.`)
  }

  const { state, fixes } = sanitizeReferences(parsed.data)
  const names = Object.keys(arrayCollections) as ArrayCollectionName[]
  const counts = names
    .map((name) => ({ name, incoming: state[name].length, existing: current[name].length }))
    .filter((c) => c.incoming > 0 || c.existing > 0)

  return {
    exportedAt: envelope.data.exportedAt,
    schemaVersion: envelope.data.schemaVersion,
    counts,
    totalIncoming: counts.reduce((sum, c) => sum + c.incoming, 0),
    referenceFixes: fixes,
    data: state,
  }
}

function findDuplicateIds(state: DbState): string | null {
  for (const name of Object.keys(arrayCollections) as ArrayCollectionName[]) {
    const seen = new Set<string>()
    for (const item of state[name] as Array<{ id: string }>) {
      if (seen.has(item.id)) return name
      seen.add(item.id)
    }
  }
  return null
}

/**
 * Merge: records are matched by id; the one with the newer `updatedAt` wins (imported wins ties).
 * The current profile and active timer are kept. Replace: imported data fully replaces current data.
 */
export function applyImport(current: DbState, incoming: DbState, strategy: ImportStrategy): DbState {
  if (strategy === 'replace') return incoming

  const merged = { ...current }
  for (const name of Object.keys(arrayCollections) as ArrayCollectionName[]) {
    const byId = new Map<string, { id: string; updatedAt?: string; createdAt?: string }>()
    for (const item of current[name] as Array<{ id: string; updatedAt?: string; createdAt?: string }>) {
      byId.set(item.id, item)
    }
    for (const item of incoming[name] as Array<{ id: string; updatedAt?: string; createdAt?: string }>) {
      const existing = byId.get(item.id)
      const existingStamp = existing?.updatedAt ?? existing?.createdAt ?? ''
      const incomingStamp = item.updatedAt ?? item.createdAt ?? ''
      if (!existing || incomingStamp >= existingStamp) byId.set(item.id, item)
    }
    ;(merged as Record<string, unknown>)[name] = [...byId.values()]
  }
  return sanitizeReferences(merged).state
}
