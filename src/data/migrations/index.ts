/**
 * Schema versioning.
 *
 * Every breaking change to the stored shape bumps CURRENT_SCHEMA_VERSION and adds a migration
 * that upgrades raw (unvalidated) collections from `version - 1` to `version`.
 * Migrations run both when loading from localStorage and when importing an older backup.
 */
export const CURRENT_SCHEMA_VERSION = 1

export type RawCollections = Record<string, unknown>

type Migration = (raw: RawCollections) => RawCollections

/** Key = target version. Example for a future v2:
 *  2: (raw) => ({ ...raw, tasks: (raw.tasks as any[]).map(t => ({ ...t, newField: null })) })
 */
export const migrations: Record<number, Migration> = {}

export class MigrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MigrationError'
  }
}

export function migrate(raw: RawCollections, fromVersion: number, toVersion = CURRENT_SCHEMA_VERSION): RawCollections {
  if (!Number.isInteger(fromVersion) || fromVersion < 1) {
    throw new MigrationError('Ma’lumotlar sxemasi versiyasi aniqlanmadi.')
  }
  if (fromVersion > toVersion) {
    throw new MigrationError(
      `Ma’lumotlar ilovaning yangiroq versiyasida yaratilgan (v${fromVersion}). Joriy ilova v${toVersion} ni qo‘llab-quvvatlaydi.`,
    )
  }
  let result = raw
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    const step = migrations[v]
    if (!step) {
      throw new MigrationError(`v${v - 1} → v${v} migratsiyasi topilmadi.`)
    }
    result = step(result)
  }
  return result
}
