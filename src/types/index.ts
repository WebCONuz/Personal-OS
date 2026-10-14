import type { z } from 'zod'
import type * as S from '@/data/schema/entities'

export type { DbState, ArrayCollectionName, CollectionName, EntityOf } from '@/data/schema/db'
export type { DateKey, MonthKey } from '@/services/date'
export type { Currency, CurrencyTotals } from '@/services/money'

export type Profile = z.infer<typeof S.profileSchema>
export type LifeArea = z.infer<typeof S.lifeAreaSchema>
export type Goal = z.infer<typeof S.goalSchema>
export type GoalProgress = z.infer<typeof S.goalProgressSchema>
export type Milestone = z.infer<typeof S.milestoneSchema>
export type Task = z.infer<typeof S.taskSchema>
export type Project = z.infer<typeof S.projectSchema>
export type WeeklyPlan = z.infer<typeof S.weeklyPlanSchema>
export type WeeklyPriority = z.infer<typeof S.weeklyPrioritySchema>
export type Habit = z.infer<typeof S.habitSchema>
export type HabitLog = z.infer<typeof S.habitLogSchema>
export type TimeEntry = z.infer<typeof S.timeEntrySchema>
export type ActiveTimer = NonNullable<z.infer<typeof S.activeTimerSchema>>
export type Transaction = z.infer<typeof S.transactionSchema>
export type Budget = z.infer<typeof S.budgetSchema>
export type SavingsGoal = z.infer<typeof S.savingsGoalSchema>
export type SavingsContribution = z.infer<typeof S.savingsContributionSchema>
export type LearningItem = z.infer<typeof S.learningItemSchema>
export type VocabEntry = z.infer<typeof S.vocabEntrySchema>
export type Skill = z.infer<typeof S.skillSchema>
export type Achievement = z.infer<typeof S.achievementSchema>
export type JobApplication = z.infer<typeof S.jobApplicationSchema>
export type Idea = z.infer<typeof S.ideaSchema>
export type Contact = z.infer<typeof S.contactSchema>
export type KnowledgeNote = z.infer<typeof S.knowledgeNoteSchema>
export type Review = z.infer<typeof S.reviewSchema>
export type XpEvent = z.infer<typeof S.xpEventSchema>
export type HealthLog = z.infer<typeof S.healthLogSchema>
export type FamilyEvent = z.infer<typeof S.familyEventSchema>

export type GoalStatus = Goal['status']
export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']
export type LifeAreaKey = LifeArea['key']
export type Theme = Profile['theme']
