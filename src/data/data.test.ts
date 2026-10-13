import { describe, expect, it } from 'vitest'
import { emptyState, goal, habit, milestone, task } from '@/test/factories'
import { removeEntities, sanitizeReferences } from './relations'
import { dbStateSchema, storageKeyOf } from './schema/db'
import { createDemoData, withDemoData, withoutDemoData, countDemoRecords } from './seed/demo'
import { createMemoryAdapter, StorageError, type StorageAdapter } from './storage/adapter'
import { loadState, persistPatch, writeMeta } from './storage/persistence'

describe('relations', () => {
  it('cascades owned records and unlinks references when a goal is deleted', () => {
    const g = goal({ id: 'g1' })
    const child = goal({ id: 'g2', parentGoalId: 'g1' })
    const state = {
      ...emptyState(),
      goals: [g, child],
      milestones: [milestone({ id: 'm1', goalId: 'g1' }), milestone({ id: 'm2', goalId: 'g2' })],
      tasks: [task({ id: 't1', goalId: 'g1' }), task({ id: 't2' })],
    }
    const patch = removeEntities(state, 'goals', ['g1'])
    expect(patch.goals?.map((x) => x.id)).toEqual(['g2'])
    expect(patch.goals?.[0].parentGoalId).toBeUndefined()
    expect(patch.milestones?.map((m) => m.id)).toEqual(['m2'])
    expect(patch.tasks?.find((t) => t.id === 't1')).toBeDefined()
    expect(patch.tasks?.find((t) => t.id === 't1')?.goalId).toBeUndefined()
  })

  it('removes habit logs together with the habit', () => {
    const h = habit({ id: 'h1' })
    const T = '2026-10-01T10:00:00.000Z'
    const state = {
      ...emptyState(),
      habits: [h],
      habitLogs: [{ id: 'l1', habitId: 'h1', date: '2026-10-01', completed: true, createdAt: T, updatedAt: T }],
    }
    const patch = removeEntities(state, 'habits', ['h1'])
    expect(patch.habitLogs).toEqual([])
  })

  it('clears the running timer reference when its task is deleted', () => {
    const state = { ...emptyState(), tasks: [task({ id: 't1' })], timer: { startedAt: '2026-10-01T10:00:00.000Z', taskId: 't1' } }
    const patch = removeEntities(state, 'tasks', ['t1'])
    expect(patch.timer).toEqual({ startedAt: '2026-10-01T10:00:00.000Z' })
  })

  it('unlinks learning sessions and skill links when their parents are deleted', () => {
    const T = '2026-10-01T10:00:00.000Z'
    const state = {
      ...emptyState(),
      skills: [{ id: 's1', name: 'SQL', category: 'Backend', currentLevel: 2, createdAt: T, updatedAt: T }],
      learningItems: [{ id: 'l1', title: 'Kitob', type: 'book' as const, status: 'learning' as const, skillId: 's1', createdAt: T, updatedAt: T }],
      tasks: [task({ id: 't1', learningItemId: 'l1' })],
    }
    expect(removeEntities(state, 'learningItems', ['l1']).tasks?.[0].learningItemId).toBeUndefined()
    expect(removeEntities(state, 'skills', ['s1']).learningItems?.[0].skillId).toBeUndefined()
  })

  it('detects and fixes dangling references', () => {
    const state = {
      ...emptyState(),
      tasks: [task({ id: 't1', goalId: 'missing', projectId: 'missing-too' })],
      milestones: [milestone({ id: 'm1', goalId: 'missing' })],
    }
    const { state: fixed, fixes } = sanitizeReferences(state)
    expect(fixes).toBe(3)
    expect(fixed.tasks[0].goalId).toBeUndefined()
    expect(fixed.tasks[0].projectId).toBeUndefined()
    expect(fixed.milestones).toEqual([])
  })
})

describe('persistence', () => {
  it('rolls back already-written keys when a multi-collection write fails', () => {
    const memory = createMemoryAdapter({ [storageKeyOf('goals')]: '[]', [storageKeyOf('tasks')]: '[]' })
    let writes = 0
    const flaky: StorageAdapter = {
      ...memory,
      setItem(key, value) {
        writes++
        if (writes === 2) throw new DOMException('full', 'QuotaExceededError')
        memory.setItem(key, value)
      },
    }
    const state = emptyState()
    expect(() => persistPatch(flaky, { goals: [goal()], tasks: [task()] })).toThrow(StorageError)
    expect(memory.getItem(storageKeyOf('goals'))).toBe('[]')
    expect(memory.getItem(storageKeyOf('tasks'))).toBe('[]')
    expect(state.goals).toEqual([])
  })

  it('reports quota errors in plain language', () => {
    const adapter: StorageAdapter = {
      ...createMemoryAdapter(),
      setItem() {
        throw new DOMException('full', 'QuotaExceededError')
      },
    }
    try {
      persistPatch(adapter, { goals: [] })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError)
      expect((error as StorageError).kind).toBe('quota')
    }
  })

  it('keeps a recovery copy of corrupt JSON and loads the rest', () => {
    const adapter = createMemoryAdapter({
      [storageKeyOf('tasks')]: '{"broken',
      [storageKeyOf('goals')]: JSON.stringify([goal({ id: 'ok' })]),
    })
    writeMeta(adapter, { schemaVersion: 1, onboarded: true, demoLoaded: false })
    const result = loadState(adapter)
    expect(result.data.goals.map((g) => g.id)).toEqual(['ok'])
    expect(result.data.tasks).toEqual([])
    expect(result.issues).toHaveLength(1)
    const key = result.issues[0].recoveryKey!
    expect(adapter.getItem(key)).toBe('{"broken')
    // The corrupt original is not overwritten during load.
    expect(adapter.getItem(storageKeyOf('tasks'))).toBe('{"broken')
  })

  it('salvages valid items when some records are invalid', () => {
    const adapter = createMemoryAdapter({
      [storageKeyOf('tasks')]: JSON.stringify([task({ id: 'good' }), { id: 'bad', title: '' }]),
    })
    const result = loadState(adapter)
    expect(result.data.tasks.map((t) => t.id)).toEqual(['good'])
    expect(result.issues[0].kind).toBe('validation')
  })

  it('blocks writes for data from a newer schema version', () => {
    const adapter = createMemoryAdapter()
    writeMeta(adapter, { schemaVersion: 99, onboarded: true, demoLoaded: false })
    const result = loadState(adapter)
    expect(result.writeBlocked).toBe(true)
    expect(result.issues[0].kind).toBe('migration')
  })
})

describe('demo data', () => {
  const today = '2026-10-13'

  it('is valid against the schema and has no dangling references', () => {
    const state = withDemoData(emptyState(), today)
    expect(dbStateSchema.safeParse(state).success).toBe(true)
    expect(sanitizeReferences(state).fixes).toBe(0)
  })

  it('uses demo- ids only and can be removed without touching user data', () => {
    const demo = createDemoData(today)
    for (const list of Object.values(demo)) {
      for (const item of list as Array<{ id: string }>) expect(item.id.startsWith('demo-')).toBe(true)
    }
    const userTask = task({ id: 'mine', goalId: 'demo-goal-career' })
    const withDemo = { ...withDemoData(emptyState(), today) }
    withDemo.tasks = [...withDemo.tasks, userTask]
    withDemo.xpEvents = [...withDemo.xpEvents, { id: 'user-xp', sourceType: 'task', sourceId: 'demo-task-4', points: 20, reason: 'x', createdAt: '2026-10-13T10:00:00.000Z' }]
    expect(countDemoRecords(withDemo)).toBeGreaterThan(50)
    const cleaned = withoutDemoData(withDemo)
    expect(countDemoRecords(cleaned)).toBe(0)
    expect(cleaned.tasks).toHaveLength(1)
    expect(cleaned.tasks[0].goalId).toBeUndefined()
    expect(cleaned.lifeAreas).toHaveLength(8)
    expect(cleaned.xpEvents).toEqual([])
  })
})
