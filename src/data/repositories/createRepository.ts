import { createId, nowIso } from '@/lib/id'
import { mutate, type MutateOptions } from '../mutate'
import { removeEntities } from '../relations'
import type { ArrayCollectionName, DbState, EntityOf } from '../schema/db'
import { getDb } from '../store'

type SystemFields = 'id' | 'createdAt' | 'updatedAt'

export type NewEntity<T> = Omit<T, SystemFields>
export type EntityPatch<T> = Partial<Omit<T, SystemFields>>

/** Removes keys explicitly set to `undefined` so optional links can be cleared on update. */
function compact<T extends object>(obj: T): T {
  const copy = { ...obj } as Record<string, unknown>
  for (const key of Object.keys(copy)) {
    if (copy[key] === undefined) delete copy[key]
  }
  return copy as T
}

export interface Repository<K extends ArrayCollectionName> {
  getAll(): EntityOf<K>[]
  getById(id: string): EntityOf<K> | undefined
  build(input: NewEntity<EntityOf<K>>): EntityOf<K>
  create(input: NewEntity<EntityOf<K>>, opts?: MutateOptions): EntityOf<K> | null
  update(id: string, patch: EntityPatch<EntityOf<K>>, opts?: MutateOptions): boolean
  remove(id: string, opts?: MutateOptions): boolean
  /** Pure helpers for composing multi-collection mutations. */
  withCreated(state: DbState, entity: EntityOf<K>): Partial<DbState>
  withUpdated(state: DbState, id: string, patch: EntityPatch<EntityOf<K>>): Partial<DbState>
}

/**
 * Generic CRUD repository over one collection.
 * Writes go through `mutate` → store.commit → storage adapter, so UI never touches storage directly.
 */
export function createRepository<K extends ArrayCollectionName>(name: K): Repository<K> {
  type T = EntityOf<K>
  const list = (state: DbState) => state[name] as T[]

  const repo: Repository<K> = {
    getAll: () => list(getDb()),
    getById: (id) => list(getDb()).find((e) => e.id === id),

    build: (input) => {
      const now = nowIso()
      return compact({ ...input, id: createId(), createdAt: now, updatedAt: now }) as T
    },

    withCreated: (state, entity) => ({ [name]: [...list(state), entity] }) as Partial<DbState>,

    withUpdated: (state, id, patch) => {
      const items = list(state)
      const index = items.findIndex((e) => e.id === id)
      if (index === -1) throw new Error('Yozuv topilmadi. U o‘chirilgan bo‘lishi mumkin.')
      const next = [...items]
      next[index] = compact({ ...items[index], ...patch, updatedAt: nowIso() }) as T
      return { [name]: next } as Partial<DbState>
    },

    create: (input, opts) => {
      const entity = repo.build(input)
      return mutate((s) => repo.withCreated(s, entity), opts) ? entity : null
    },

    update: (id, patch, opts) => mutate((s) => repo.withUpdated(s, id, patch), opts),

    remove: (id, opts) => mutate((s) => removeEntities(s, name, [id]), opts),
  }
  return repo
}
