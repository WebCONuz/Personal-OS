import { createId, nowIso } from '@/lib/id'
import { notify } from '@/lib/notify'
import { mutate } from '@/data/mutate'
import { repos } from '@/data/repositories'
import { getDb } from '@/data/store'
import { endOfWeekKey, type DateKey } from '@/services/date'
import { XP_RULES } from '@/services/gamification/config'
import { awardOnce } from '@/services/gamification/xp'
import type { Review } from '@/types'

export type ReviewContent = Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'periodType' | 'periodStart' | 'periodEnd'>

export const EMPTY_REVIEW: ReviewContent = {
  wins: '',
  worked: '',
  blockers: '',
  lessons: '',
  neglectedAreaIds: [],
  keepDoing: '',
  stopDoing: '',
  startDoing: '',
  nextPriorities: [],
}

function upsert(periodType: Review['periodType'], periodStart: DateKey, periodEnd: DateKey, content: ReviewContent, xp: boolean) {
  let awarded = 0
  const ok = mutate((state) => {
    const existing = state.reviews.find((r) => r.periodType === periodType && r.periodStart === periodStart)
    const now = nowIso()
    const review: Review = existing
      ? { ...existing, ...content, updatedAt: now }
      : { id: createId(), periodType, periodStart, periodEnd, ...content, createdAt: now, updatedAt: now }
    const reviews = existing ? state.reviews.map((r) => (r.id === existing.id ? review : r)) : [...state.reviews, review]
    if (!xp) return { reviews }
    const result = awardOnce(state.xpEvents, {
      sourceType: 'review',
      sourceId: `${periodType}:${periodStart}`,
      points: XP_RULES.weeklyReview,
      reason: 'Haftalik review',
    })
    if (result.awarded) awarded = XP_RULES.weeklyReview
    // Completing the review closes the week's plan (if one exists).
    const weeklyPlans = state.weeklyPlans.map((p) => (p.weekStart === periodStart && p.status !== 'completed' ? { ...p, status: 'completed' as const, updatedAt: now } : p))
    return { reviews, xpEvents: result.events, weeklyPlans }
  })
  if (ok) {
    const suffix = awarded && getDb().profile.gamificationEnabled ? ` · +${awarded} XP` : ''
    notify.success(`${periodType === 'weekly' ? 'Haftalik review' : 'Kun yakuni'} saqlandi${suffix}`)
  }
  return ok
}

export const reviewService = {
  saveWeekly(weekStart: DateKey, content: ReviewContent) {
    return upsert('weekly', weekStart, endOfWeekKey(weekStart), content, true)
  },
  saveDaily(day: DateKey, content: Pick<ReviewContent, 'wins' | 'lessons' | 'energy'>) {
    const existing = getDb().reviews.find((r) => r.periodType === 'daily' && r.periodStart === day)
    return upsert('daily', day, day, { ...EMPTY_REVIEW, ...(existing ?? {}), ...content }, false)
  },
  remove(id: string) {
    return repos.reviews.remove(id, { success: 'Review o‘chirildi' })
  },
}
