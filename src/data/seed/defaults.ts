import { nowIso } from '@/lib/id'
import type { DbState } from '../schema/db'
import type { LIFE_AREA_KEYS } from '../schema/entities'

type LifeAreaKey = (typeof LIFE_AREA_KEYS)[number]

export const DEFAULT_LIFE_AREAS: Array<{ key: LifeAreaKey; name: string; icon: string }> = [
  { key: 'career', name: 'Karyera', icon: 'briefcase' },
  { key: 'business', name: 'Biznes', icon: 'rocket' },
  { key: 'learning', name: 'Ta’lim', icon: 'graduation-cap' },
  { key: 'knowledge', name: 'Bilim', icon: 'book-open' },
  { key: 'finance', name: 'Moliya', icon: 'wallet' },
  { key: 'productivity', name: 'Samaradorlik', icon: 'target' },
  { key: 'family', name: 'Oila', icon: 'heart' },
  { key: 'health', name: 'Salomatlik', icon: 'activity' },
]

/** Life areas have stable ids derived from their key so seed and imports stay consistent. */
export function lifeAreaId(key: LifeAreaKey): string {
  return `area-${key}`
}

export function createDefaultState(now: string = nowIso()): DbState {
  return {
    profile: {
      id: 'profile',
      displayName: '',
      weekStartsOn: 1,
      locale: 'uz-UZ',
      defaultCurrency: 'UZS',
      theme: 'light',
      gamificationEnabled: true,
      weeklyCapacityMinutes: 600,
      bufferPercent: 20,
      createdAt: now,
      updatedAt: now,
    },
    timer: null,
    lifeAreas: DEFAULT_LIFE_AREAS.map((a, i) => ({
      id: lifeAreaId(a.key),
      key: a.key,
      name: a.name,
      icon: a.icon,
      isActive: true,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    })),
    goals: [],
    goalProgress: [],
    milestones: [],
    tasks: [],
    projects: [],
    weeklyPlans: [],
    habits: [],
    habitLogs: [],
    timeEntries: [],
    transactions: [],
    budgets: [],
    savingsGoals: [],
    savingsContributions: [],
    learningItems: [],
    vocab: [],
    skills: [],
    achievements: [],
    jobApplications: [],
    ideas: [],
    contacts: [],
    knowledgeNotes: [],
    reviews: [],
    xpEvents: [],
    healthLogs: [],
    familyEvents: [],
  }
}
