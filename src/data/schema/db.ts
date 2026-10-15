import { z } from 'zod'
import {
  achievementSchema,
  activeTimerSchema,
  budgetSchema,
  contactSchema,
  familyEventSchema,
  goalProgressSchema,
  goalSchema,
  habitLogSchema,
  habitSchema,
  healthLogSchema,
  ideaSchema,
  jobApplicationSchema,
  knowledgeNoteSchema,
  learningItemSchema,
  lifeAreaSchema,
  milestoneSchema,
  profileSchema,
  projectSchema,
  reviewSchema,
  savingsContributionSchema,
  savingsGoalSchema,
  skillSchema,
  taskSchema,
  timeEntrySchema,
  transactionSchema,
  vocabEntrySchema,
  weeklyPlanSchema,
  xpEventSchema,
} from './entities'

export const STORAGE_PREFIX = 'personal-os:'
export const META_KEY = `${STORAGE_PREFIX}meta`
export const RECOVERY_PREFIX = `${STORAGE_PREFIX}recovery:`
export const PRE_MIGRATION_PREFIX = `${STORAGE_PREFIX}pre-migration-`

/** Collections that hold arrays of entities. */
export const arrayCollections = {
  lifeAreas: { key: 'life-areas', item: lifeAreaSchema },
  goals: { key: 'goals', item: goalSchema },
  goalProgress: { key: 'goal-progress', item: goalProgressSchema },
  milestones: { key: 'milestones', item: milestoneSchema },
  tasks: { key: 'tasks', item: taskSchema },
  projects: { key: 'projects', item: projectSchema },
  weeklyPlans: { key: 'weekly-plans', item: weeklyPlanSchema },
  habits: { key: 'habits', item: habitSchema },
  habitLogs: { key: 'habit-logs', item: habitLogSchema },
  timeEntries: { key: 'time-entries', item: timeEntrySchema },
  transactions: { key: 'transactions', item: transactionSchema },
  budgets: { key: 'budgets', item: budgetSchema },
  savingsGoals: { key: 'savings-goals', item: savingsGoalSchema },
  savingsContributions: { key: 'savings-contributions', item: savingsContributionSchema },
  learningItems: { key: 'learning-items', item: learningItemSchema },
  vocab: { key: 'vocab', item: vocabEntrySchema },
  skills: { key: 'skills', item: skillSchema },
  achievements: { key: 'achievements', item: achievementSchema },
  jobApplications: { key: 'job-applications', item: jobApplicationSchema },
  ideas: { key: 'ideas', item: ideaSchema },
  contacts: { key: 'contacts', item: contactSchema },
  knowledgeNotes: { key: 'knowledge-notes', item: knowledgeNoteSchema },
  reviews: { key: 'reviews', item: reviewSchema },
  xpEvents: { key: 'xp-events', item: xpEventSchema },
  healthLogs: { key: 'health-logs', item: healthLogSchema },
  familyEvents: { key: 'family-events', item: familyEventSchema },
} as const

export type ArrayCollectionName = keyof typeof arrayCollections

type ArrayShape = {
  [K in ArrayCollectionName]: z.ZodDefault<z.ZodArray<(typeof arrayCollections)[K]['item']>>
}

const arrayShape = Object.fromEntries(
  Object.entries(arrayCollections).map(([name, def]) => [name, z.array(def.item).default([])]),
) as ArrayShape

export const dbStateSchema = z.object({
  profile: profileSchema,
  timer: activeTimerSchema.default(null),
  ...arrayShape,
})

export type DbState = z.infer<typeof dbStateSchema>
export type CollectionName = keyof DbState
export type EntityOf<K extends ArrayCollectionName> = DbState[K][number]

export const singletonCollections = {
  profile: { key: 'profile', schema: profileSchema },
  timer: { key: 'timer', schema: activeTimerSchema },
} as const

export const COLLECTION_NAMES = [
  ...(Object.keys(singletonCollections) as Array<keyof typeof singletonCollections>),
  ...(Object.keys(arrayCollections) as ArrayCollectionName[]),
] as CollectionName[]

export function storageKeyOf(name: CollectionName): string {
  if (name === 'profile' || name === 'timer') {
    return STORAGE_PREFIX + singletonCollections[name].key
  }
  return STORAGE_PREFIX + arrayCollections[name].key
}

const COLLECTION_KEYS = new Set(COLLECTION_NAMES.map(storageKeyOf))

/**
 * Keys holding user data (collections, meta, recovery copies). Other `personal-os:*` keys —
 * per-device UI prefs and the theme hint — stay in localStorage and are never part of the database.
 */
export function isDataKey(key: string): boolean {
  return key === META_KEY || COLLECTION_KEYS.has(key) || key.startsWith(RECOVERY_PREFIX) || key.startsWith(PRE_MIGRATION_PREFIX)
}

export function schemaOf(name: CollectionName): z.ZodType {
  if (name === 'profile' || name === 'timer') return singletonCollections[name].schema
  return z.array(arrayCollections[name].item)
}

export function isArrayCollection(name: CollectionName): name is ArrayCollectionName {
  return name !== 'profile' && name !== 'timer'
}
