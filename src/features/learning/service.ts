import { repos, type NewEntity } from '@/data/repositories'
import { todayKey } from '@/services/date'
import type { LearningItem, VocabEntry } from '@/types'

export type LearningInput = NewEntity<LearningItem>
export type VocabInput = NewEntity<VocabEntry>

/** Prefix used to recognise English practice time entries. */
export const ENGLISH_PRACTICE_PREFIX = 'Ingliz tili'

/** Status changes keep start/finish dates consistent. */
function withStatusDates<T extends Partial<LearningInput>>(item: T, current?: LearningItem): T {
  const status = item.status ?? current?.status
  const startedAt = item.startedAt ?? current?.startedAt
  const completedAt = item.completedAt ?? current?.completedAt
  return {
    ...item,
    startedAt: status === 'learning' || status === 'completed' ? (startedAt ?? todayKey()) : startedAt,
    completedAt: status === 'completed' ? (completedAt ?? todayKey()) : undefined,
  }
}

export const learningService = {
  create: (input: LearningInput) => repos.learningItems.create(withStatusDates(input), { success: 'Resurs qo‘shildi' }),
  update: (id: string, patch: Partial<LearningInput>) =>
    repos.learningItems.update(id, withStatusDates(patch, repos.learningItems.getById(id)), { success: 'Resurs yangilandi' }),
  setStatus: (id: string, status: LearningItem['status']) =>
    repos.learningItems.update(id, withStatusDates({ status }, repos.learningItems.getById(id)), { success: 'Holat yangilandi' }),
  remove: (id: string) => repos.learningItems.remove(id, { success: 'Resurs o‘chirildi' }),
}

export const vocabService = {
  create: (input: VocabInput) => repos.vocab.create(input, { success: 'Ibora qo‘shildi' }),
  update: (id: string, patch: Partial<VocabInput>) => repos.vocab.update(id, patch),
  remove: (id: string) => repos.vocab.remove(id, { success: 'Ibora o‘chirildi' }),
}
