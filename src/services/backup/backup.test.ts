import { describe, expect, it } from 'vitest'
import { emptyState, goal, task } from '@/test/factories'
import { applyImport, backupFileName, createBackup, ImportError, parseBackup } from './index'

describe('backup export', () => {
  it('includes app name, schema version, timestamp and all collections', () => {
    const state = { ...emptyState(), goals: [goal({ id: 'g' })] }
    const backup = createBackup(state, new Date('2026-10-13T08:00:00Z'))
    expect(backup).toMatchObject({ appName: 'personal-os', schemaVersion: 1, exportedAt: '2026-10-13T08:00:00.000Z' })
    expect(backup.collections.goals).toHaveLength(1)
    expect(backupFileName(new Date(2026, 9, 13))).toBe('personal-os-backup-2026-10-13.json')
  })
})

describe('backup import', () => {
  const current = { ...emptyState(), goals: [goal({ id: 'existing' })] }

  it('round-trips an exported file', () => {
    const source = { ...emptyState(), goals: [goal({ id: 'g1' })], tasks: [task({ id: 't1', goalId: 'g1' })] }
    const preview = parseBackup(JSON.stringify(createBackup(source)), current)
    expect(preview.totalIncoming).toBeGreaterThan(0)
    expect(preview.data.tasks[0].goalId).toBe('g1')
    expect(preview.referenceFixes).toBe(0)
  })

  it.each([
    ['{not json', /JSON/],
    [JSON.stringify({ hello: 'world' }), /zaxira fayli emas/],
    [JSON.stringify({ appName: 'other', schemaVersion: 1, exportedAt: 'x', collections: {} }), /boshqa ilova/],
    [JSON.stringify({ appName: 'personal-os', schemaVersion: 7, exportedAt: 'x', collections: {} }), /yangiroq versiya/],
  ])('rejects invalid file %#', (text, message) => {
    expect(() => parseBackup(text, current)).toThrow(ImportError)
    expect(() => parseBackup(text, current)).toThrow(message)
  })

  it('rejects records that fail validation', () => {
    const backup = createBackup(emptyState())
    const broken = { ...backup, collections: { ...backup.collections, transactions: [{ id: 'x', amount: -5 }] } }
    expect(() => parseBackup(JSON.stringify(broken), current)).toThrow(/validatsiyadan o‘tmadi/)
  })

  it('rejects duplicate ids', () => {
    const backup = createBackup({ ...emptyState(), goals: [goal({ id: 'dup' }), goal({ id: 'dup' })] })
    expect(() => parseBackup(JSON.stringify(backup), current)).toThrow(/takroriy ID/)
  })

  it('merge keeps existing records and lets the newer version win', () => {
    const older = goal({ id: 'shared', title: 'Old', updatedAt: '2026-10-01T00:00:00.000Z' })
    const newer = goal({ id: 'shared', title: 'New', updatedAt: '2026-10-05T00:00:00.000Z' })
    const base = { ...emptyState(), goals: [goal({ id: 'mine' }), newer] }
    const incoming = { ...emptyState(), goals: [older, goal({ id: 'theirs' })] }
    const merged = applyImport(base, incoming, 'merge')
    expect(merged.goals.map((g) => g.id).sort()).toEqual(['mine', 'shared', 'theirs'])
    expect(merged.goals.find((g) => g.id === 'shared')?.title).toBe('New')
    expect(merged.profile).toBe(base.profile)
  })

  it('replace swaps the whole dataset', () => {
    const incoming = { ...emptyState(), goals: [goal({ id: 'only' })] }
    expect(applyImport(current, incoming, 'replace').goals.map((g) => g.id)).toEqual(['only'])
  })
})
