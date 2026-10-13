import { z } from 'zod'
import { isValidDateKey, MONTH_KEY_RE } from '@/services/date'
import { CURRENCIES } from '@/services/money'

// ---------- Primitives ----------

export const idSchema = z.string().min(1)
export const timestampSchema = z.iso.datetime({ offset: true })
export const dateKeySchema = z.string().refine(isValidDateKey, { message: 'Sana noto‘g‘ri formatda' })
export const monthKeySchema = z.string().regex(MONTH_KEY_RE)
export const currencySchema = z.enum(CURRENCIES)
export const positiveAmountSchema = z.number().finite().positive()

const base = {
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}

// ---------- Enums ----------

export const LIFE_AREA_KEYS = [
  'career',
  'business',
  'learning',
  'finance',
  'knowledge',
  'productivity',
  'family',
  'health',
] as const
export const GOAL_STATUSES = ['planned', 'active', 'paused', 'completed', 'cancelled'] as const
export const GOAL_METRICS = ['completion', 'percent', 'numeric', 'milestone'] as const
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const
export const PROJECT_STATUSES = GOAL_STATUSES
export const PROJECT_KINDS = ['work', 'business', 'portfolio', 'research', 'personal'] as const
export const WEEKLY_PLAN_STATUSES = ['draft', 'active', 'completed'] as const
export const HABIT_FREQUENCIES = ['daily', 'weekly'] as const
export const TRANSACTION_TYPES = ['income', 'expense'] as const
export const SAVINGS_STATUSES = ['active', 'paused', 'completed', 'cancelled'] as const
export const CONTRIBUTION_TYPES = ['deposit', 'withdrawal'] as const
export const LEARNING_TYPES = ['course', 'book', 'article', 'video', 'topic'] as const
export const LEARNING_STATUSES = ['to_learn', 'learning', 'completed', 'paused'] as const
export const ACHIEVEMENT_TYPES = ['project', 'code', 'portfolio', 'article', 'certificate', 'talk', 'other'] as const
export const JOB_STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'] as const
export const IDEA_STATUSES = ['inbox', 'researching', 'validated', 'building', 'launched', 'paused', 'rejected'] as const
export const CONTACT_STAGES = ['lead', 'contacted', 'talking', 'client', 'lost'] as const
export const REVIEW_PERIODS = ['daily', 'weekly'] as const
export const XP_SOURCES = ['task', 'habit', 'milestone', 'goal', 'review', 'challenge', 'adjustment'] as const
export const FAMILY_EVENT_KINDS = ['important_date', 'plan', 'note'] as const
export const THEMES = ['light', 'dark', 'system'] as const

// ---------- Entities ----------

export const profileSchema = z.object({
  ...base,
  displayName: z.string().max(60).default(''),
  weekStartsOn: z.literal(1).default(1),
  locale: z.string().default('uz-UZ'),
  defaultCurrency: currencySchema.default('UZS'),
  theme: z.enum(THEMES).default('light'),
  gamificationEnabled: z.boolean().default(true),
  /** Default weekly capacity (minutes) available for planned work outside the main job. */
  weeklyCapacityMinutes: z.number().int().min(0).max(10080).default(600),
  /** Part of the capacity intentionally left free. */
  bufferPercent: z.number().int().min(0).max(80).default(20),
})

export const lifeAreaSchema = z.object({
  ...base,
  key: z.enum(LIFE_AREA_KEYS),
  name: z.string().min(1),
  icon: z.string().min(1),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
})

export const goalSchema = z.object({
  ...base,
  title: z.string().min(1),
  description: z.string().default(''),
  lifeAreaId: idSchema.optional(),
  status: z.enum(GOAL_STATUSES),
  metricType: z.enum(GOAL_METRICS),
  targetValue: z.number().finite().positive().optional(),
  currentValue: z.number().finite().min(0).default(0),
  unit: z.string().optional(),
  startDate: dateKeySchema.optional(),
  targetDate: dateKeySchema.optional(),
  parentGoalId: idSchema.optional(),
  completedAt: timestampSchema.optional(),
})

/** Progress history for goals: every manual progress update is an event (trend source). */
export const goalProgressSchema = z.object({
  ...base,
  goalId: idSchema,
  value: z.number().finite().min(0),
  note: z.string().optional(),
  date: dateKeySchema,
})

export const milestoneSchema = z.object({
  ...base,
  goalId: idSchema.optional(),
  projectId: idSchema.optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'done']),
  targetDate: dateKeySchema.optional(),
  completedAt: timestampSchema.optional(),
  sortOrder: z.number().int().default(0),
})

export const taskSchema = z.object({
  ...base,
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  lifeAreaId: idSchema.optional(),
  goalId: idSchema.optional(),
  projectId: idSchema.optional(),
  /** Planned learning session for a learning resource. */
  learningItemId: idSchema.optional(),
  /** Monday of the week the task is planned for. Links the task to a weekly plan. */
  weekStart: dateKeySchema.optional(),
  /** Day inside the planned week. */
  scheduledDate: dateKeySchema.optional(),
  dueDate: dateKeySchema.optional(),
  estimatedMinutes: z.number().int().positive().max(1440).optional(),
  completedAt: timestampSchema.optional(),
})

export const projectSchema = z.object({
  ...base,
  title: z.string().min(1),
  description: z.string().default(''),
  lifeAreaId: idSchema.optional(),
  status: z.enum(PROJECT_STATUSES),
  kind: z.enum(PROJECT_KINDS).default('personal'),
  goalId: idSchema.optional(),
  startDate: dateKeySchema.optional(),
  targetDate: dateKeySchema.optional(),
  nextStep: z.string().optional(),
})

export const weeklyPrioritySchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  goalId: idSchema.optional(),
  done: z.boolean().default(false),
})

export const weeklyPlanSchema = z.object({
  ...base,
  weekStart: dateKeySchema,
  weekEnd: dateKeySchema,
  priorities: z.array(weeklyPrioritySchema).max(5).default([]),
  capacityMinutes: z.number().int().min(0).max(10080),
  bufferPercent: z.number().int().min(0).max(80),
  challenge: z
    .object({
      title: z.string().min(1),
      done: z.boolean(),
      completedAt: timestampSchema.optional(),
    })
    .optional(),
  notes: z.string().optional(),
  status: z.enum(WEEKLY_PLAN_STATUSES),
})

export const habitSchema = z.object({
  ...base,
  title: z.string().min(1),
  description: z.string().optional(),
  lifeAreaId: idSchema.optional(),
  frequency: z.enum(HABIT_FREQUENCIES),
  /** For weekly habits: how many days per week. Daily habits use 7. */
  targetPerWeek: z.number().int().min(1).max(7),
  active: z.boolean(),
})

export const habitLogSchema = z.object({
  ...base,
  habitId: idSchema,
  date: dateKeySchema,
  completed: z.boolean(),
  note: z.string().optional(),
})

export const timeEntrySchema = z.object({
  ...base,
  taskId: idSchema.optional(),
  projectId: idSchema.optional(),
  learningItemId: idSchema.optional(),
  lifeAreaId: idSchema.optional(),
  date: dateKeySchema,
  startedAt: timestampSchema.optional(),
  endedAt: timestampSchema.optional(),
  durationMinutes: z.number().int().positive().max(1440),
  source: z.enum(['manual', 'timer']),
  note: z.string().optional(),
})

export const activeTimerSchema = z
  .object({
    startedAt: timestampSchema,
    taskId: idSchema.optional(),
    projectId: idSchema.optional(),
    learningItemId: idSchema.optional(),
    lifeAreaId: idSchema.optional(),
    note: z.string().optional(),
  })
  .nullable()

export const transactionSchema = z.object({
  ...base,
  type: z.enum(TRANSACTION_TYPES),
  amount: positiveAmountSchema,
  currency: currencySchema,
  category: z.string().min(1),
  date: dateKeySchema,
  note: z.string().optional(),
  projectId: idSchema.optional(),
})

/** Monthly budget limit per expense category and currency (applies to every month). */
export const budgetSchema = z.object({
  ...base,
  category: z.string().min(1),
  amount: positiveAmountSchema,
  currency: currencySchema,
})

export const savingsGoalSchema = z.object({
  ...base,
  title: z.string().min(1),
  targetAmount: positiveAmountSchema,
  currency: currencySchema,
  targetDate: dateKeySchema.optional(),
  status: z.enum(SAVINGS_STATUSES),
  note: z.string().optional(),
})

/** Single source of truth for savings: the saved amount is the sum of contributions. */
export const savingsContributionSchema = z.object({
  ...base,
  savingsGoalId: idSchema,
  type: z.enum(CONTRIBUTION_TYPES),
  amount: positiveAmountSchema,
  date: dateKeySchema,
  note: z.string().optional(),
})

export const learningItemSchema = z.object({
  ...base,
  title: z.string().min(1),
  type: z.enum(LEARNING_TYPES),
  status: z.enum(LEARNING_STATUSES),
  url: z.string().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  lifeAreaId: idSchema.optional(),
  goalId: idSchema.optional(),
  projectId: idSchema.optional(),
  /** Skill this resource develops — groups resources into learning directions. */
  skillId: idSchema.optional(),
  startedAt: dateKeySchema.optional(),
  completedAt: dateKeySchema.optional(),
})

export const vocabEntrySchema = z.object({
  ...base,
  phrase: z.string().min(1),
  meaning: z.string().default(''),
  example: z.string().optional(),
  learned: z.boolean().default(false),
})

export const skillSchema = z.object({
  ...base,
  name: z.string().min(1),
  category: z.string().min(1),
  currentLevel: z.number().int().min(1).max(5),
  targetLevel: z.number().int().min(1).max(5).optional(),
  learningPlan: z.string().optional(),
  evidenceNote: z.string().optional(),
  lastPracticedAt: dateKeySchema.optional(),
})

export const achievementSchema = z.object({
  ...base,
  title: z.string().min(1),
  type: z.enum(ACHIEVEMENT_TYPES),
  date: dateKeySchema,
  url: z.string().optional(),
  description: z.string().optional(),
  skillIds: z.array(idSchema).default([]),
})

export const jobApplicationSchema = z.object({
  ...base,
  company: z.string().min(1),
  role: z.string().min(1),
  url: z.string().optional(),
  status: z.enum(JOB_STATUSES),
  appliedAt: dateKeySchema.optional(),
  notes: z.string().optional(),
  interviewNotes: z.string().optional(),
  nextAction: z.string().optional(),
})

const scoreSchema = z.number().int().min(1).max(5)

export const ideaSchema = z.object({
  ...base,
  title: z.string().min(1),
  problem: z.string().default(''),
  audience: z.string().optional(),
  competitors: z.string().optional(),
  distributionStrategy: z.string().optional(),
  monetizationIdea: z.string().optional(),
  scores: z
    .object({
      problem: scoreSchema,
      ease: scoreSchema,
      monetization: scoreSchema,
      distribution: scoreSchema,
    })
    .optional(),
  status: z.enum(IDEA_STATUSES),
  projectId: idSchema.optional(),
})

export const contactSchema = z.object({
  ...base,
  name: z.string().min(1),
  contactNote: z.string().optional(),
  stage: z.enum(CONTACT_STAGES),
  nextStep: z.string().optional(),
  projectId: idSchema.optional(),
})

export const knowledgeNoteSchema = z.object({
  ...base,
  title: z.string().min(1),
  content: z.string().default(''),
  tags: z.array(z.string().min(1)).default([]),
  lifeAreaId: idSchema.optional(),
  linkedGoalIds: z.array(idSchema).default([]),
  linkedProjectIds: z.array(idSchema).default([]),
  linkedLearningItemIds: z.array(idSchema).default([]),
})

export const reviewSchema = z.object({
  ...base,
  periodType: z.enum(REVIEW_PERIODS),
  periodStart: dateKeySchema,
  periodEnd: dateKeySchema,
  wins: z.string().default(''),
  worked: z.string().default(''),
  blockers: z.string().default(''),
  lessons: z.string().default(''),
  neglectedAreaIds: z.array(idSchema).default([]),
  keepDoing: z.string().default(''),
  stopDoing: z.string().default(''),
  startDoing: z.string().default(''),
  nextPriorities: z.array(z.string().min(1)).max(5).default([]),
  energy: z.number().int().min(1).max(5).optional(),
})

export const xpEventSchema = z.object({
  id: idSchema,
  sourceType: z.enum(XP_SOURCES),
  /** Stable key of the source (entity id, or `habitId:date` for habit logs). */
  sourceId: z.string().optional(),
  points: z.number().int(),
  reason: z.string().min(1),
  createdAt: timestampSchema,
})

export const healthLogSchema = z.object({
  ...base,
  date: dateKeySchema,
  metric: z.string().min(1),
  value: z.number().finite().min(0),
  unit: z.string().optional(),
  note: z.string().optional(),
})

export const familyEventSchema = z.object({
  ...base,
  title: z.string().min(1),
  date: dateKeySchema,
  kind: z.enum(FAMILY_EVENT_KINDS),
  repeatsYearly: z.boolean().default(false),
  note: z.string().optional(),
  done: z.boolean().default(false),
})

export const metaSchema = z.object({
  schemaVersion: z.number().int().positive(),
  onboarded: z.boolean().default(false),
  demoLoaded: z.boolean().default(false),
  lastExportAt: timestampSchema.optional(),
})
