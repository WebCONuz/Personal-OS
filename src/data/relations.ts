import type { ArrayCollectionName, DbState } from './schema/db'

/**
 * Declarative referential rules between collections.
 * - `cascade`: dependent records are removed together with the parent (e.g. habit logs).
 * - `unlink`: the reference is cleared, the dependent record is kept (e.g. tasks of a deleted goal).
 */
interface Relation {
  from: ArrayCollectionName
  field: string
  to: ArrayCollectionName
  onDelete: 'unlink' | 'cascade'
  many?: boolean
}

export const RELATIONS: Relation[] = [
  { from: 'goals', field: 'parentGoalId', to: 'goals', onDelete: 'unlink' },
  { from: 'goals', field: 'lifeAreaId', to: 'lifeAreas', onDelete: 'unlink' },
  { from: 'goalProgress', field: 'goalId', to: 'goals', onDelete: 'cascade' },
  { from: 'milestones', field: 'goalId', to: 'goals', onDelete: 'cascade' },
  { from: 'milestones', field: 'projectId', to: 'projects', onDelete: 'cascade' },
  { from: 'tasks', field: 'goalId', to: 'goals', onDelete: 'unlink' },
  { from: 'tasks', field: 'projectId', to: 'projects', onDelete: 'unlink' },
  { from: 'tasks', field: 'lifeAreaId', to: 'lifeAreas', onDelete: 'unlink' },
  { from: 'tasks', field: 'learningItemId', to: 'learningItems', onDelete: 'unlink' },
  { from: 'projects', field: 'goalId', to: 'goals', onDelete: 'unlink' },
  { from: 'projects', field: 'lifeAreaId', to: 'lifeAreas', onDelete: 'unlink' },
  { from: 'habits', field: 'lifeAreaId', to: 'lifeAreas', onDelete: 'unlink' },
  { from: 'habitLogs', field: 'habitId', to: 'habits', onDelete: 'cascade' },
  { from: 'timeEntries', field: 'taskId', to: 'tasks', onDelete: 'unlink' },
  { from: 'timeEntries', field: 'projectId', to: 'projects', onDelete: 'unlink' },
  { from: 'timeEntries', field: 'learningItemId', to: 'learningItems', onDelete: 'unlink' },
  { from: 'timeEntries', field: 'lifeAreaId', to: 'lifeAreas', onDelete: 'unlink' },
  { from: 'transactions', field: 'projectId', to: 'projects', onDelete: 'unlink' },
  { from: 'savingsContributions', field: 'savingsGoalId', to: 'savingsGoals', onDelete: 'cascade' },
  { from: 'learningItems', field: 'goalId', to: 'goals', onDelete: 'unlink' },
  { from: 'learningItems', field: 'projectId', to: 'projects', onDelete: 'unlink' },
  { from: 'learningItems', field: 'lifeAreaId', to: 'lifeAreas', onDelete: 'unlink' },
  { from: 'learningItems', field: 'skillId', to: 'skills', onDelete: 'unlink' },
  { from: 'achievements', field: 'skillIds', to: 'skills', onDelete: 'unlink', many: true },
  { from: 'ideas', field: 'projectId', to: 'projects', onDelete: 'unlink' },
  { from: 'contacts', field: 'projectId', to: 'projects', onDelete: 'unlink' },
  { from: 'knowledgeNotes', field: 'lifeAreaId', to: 'lifeAreas', onDelete: 'unlink' },
  { from: 'knowledgeNotes', field: 'linkedGoalIds', to: 'goals', onDelete: 'unlink', many: true },
  { from: 'knowledgeNotes', field: 'linkedProjectIds', to: 'projects', onDelete: 'unlink', many: true },
  { from: 'knowledgeNotes', field: 'linkedLearningItemIds', to: 'learningItems', onDelete: 'unlink', many: true },
  { from: 'reviews', field: 'neglectedAreaIds', to: 'lifeAreas', onDelete: 'unlink', many: true },
]

type Row = Record<string, unknown> & { id: string }
type Working = Partial<Record<ArrayCollectionName, Row[]>>

function rows(state: DbState, work: Working, name: ArrayCollectionName): Row[] {
  return work[name] ?? (state[name] as unknown as Row[])
}

/**
 * Applies one relation to `from` rows given a predicate deciding whether a referenced id is gone.
 * Returns ids that must be cascaded and whether anything changed.
 */
function applyRelation(
  rel: Relation,
  source: Row[],
  isGone: (id: string) => boolean,
): { next: Row[]; cascade: string[]; changed: number } {
  const cascade: string[] = []
  let changed = 0
  const next = source.map((row) => {
    const value = row[rel.field]
    if (rel.many) {
      if (!Array.isArray(value)) return row
      const kept = (value as string[]).filter((v) => !isGone(v))
      if (kept.length === value.length) return row
      changed++
      return { ...row, [rel.field]: kept }
    }
    if (typeof value !== 'string' || !isGone(value)) return row
    changed++
    if (rel.onDelete === 'cascade') {
      cascade.push(row.id)
      return row
    }
    const copy = { ...row }
    delete copy[rel.field]
    return copy
  })
  return { next, cascade, changed }
}

/** Fields of non-array data that reference entities (handled explicitly). */
function fixSingletons(state: DbState, work: Working, patch: Partial<DbState>): number {
  let fixes = 0
  const goalIds = new Set(rows(state, work, 'goals').map((g) => g.id))
  const plans = rows(state, work, 'weeklyPlans')
  let plansChanged = false
  const nextPlans = plans.map((plan) => {
    const priorities = plan.priorities as Array<{ goalId?: string }> | undefined
    if (!priorities?.some((p) => p.goalId && !goalIds.has(p.goalId))) return plan
    plansChanged = true
    fixes++
    return {
      ...plan,
      priorities: priorities.map((p) => {
        if (!p.goalId || goalIds.has(p.goalId)) return p
        const copy = { ...p }
        delete copy.goalId
        return copy
      }),
    }
  })
  if (plansChanged) work.weeklyPlans = nextPlans

  const timer = patch.timer !== undefined ? patch.timer : state.timer
  if (timer) {
    const t = { ...timer }
    const checks: Array<[keyof typeof t, ArrayCollectionName]> = [
      ['taskId', 'tasks'],
      ['projectId', 'projects'],
      ['learningItemId', 'learningItems'],
      ['lifeAreaId', 'lifeAreas'],
    ]
    let changed = false
    for (const [field, coll] of checks) {
      const id = t[field]
      if (typeof id === 'string' && !rows(state, work, coll).some((r) => r.id === id)) {
        delete t[field]
        changed = true
      }
    }
    if (changed) {
      patch.timer = t
      fixes++
    }
  }
  return fixes
}

function toPatch(work: Working, patch: Partial<DbState>): Partial<DbState> {
  return { ...patch, ...(work as Partial<DbState>) }
}

/** Removes entities and applies cascade/unlink rules. Returns only the changed collections. */
export function removeEntities(state: DbState, collection: ArrayCollectionName, ids: string[]): Partial<DbState> {
  const work: Working = {}
  const patch: Partial<DbState> = {}
  const queue: Array<[ArrayCollectionName, Set<string>]> = [[collection, new Set(ids)]]

  while (queue.length > 0) {
    const [name, removeIds] = queue.shift()!
    work[name] = rows(state, work, name).filter((r) => !removeIds.has(r.id))
    for (const rel of RELATIONS) {
      if (rel.to !== name) continue
      const { next, cascade, changed } = applyRelation(rel, rows(state, work, rel.from), (id) => removeIds.has(id))
      if (changed > 0) work[rel.from] = next
      if (cascade.length > 0) queue.push([rel.from, new Set(cascade)])
    }
  }
  fixSingletons(state, work, patch)
  return toPatch(work, patch)
}

/** Finds and fixes dangling references (used for imports and demo cleanup). */
export function sanitizeReferences(state: DbState): { state: DbState; fixes: number } {
  const work: Working = {}
  const patch: Partial<DbState> = {}
  let fixes = 0
  for (let pass = 0; pass < 10; pass++) {
    let passFixes = 0
    for (const rel of RELATIONS) {
      const targetIds = new Set(rows(state, work, rel.to).map((r) => r.id))
      const { next, cascade, changed } = applyRelation(rel, rows(state, work, rel.from), (id) => !targetIds.has(id))
      if (changed === 0) continue
      passFixes += changed
      const cascadeSet = new Set(cascade)
      work[rel.from] = next.filter((r) => !cascadeSet.has(r.id))
    }
    fixes += passFixes
    if (passFixes === 0) break
  }
  fixes += fixSingletons(state, work, patch)
  return { state: { ...state, ...toPatch(work, patch) }, fixes }
}
