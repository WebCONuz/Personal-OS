import { z } from 'zod'
import { checks, optionalDate, optionalNumber, optionalText, requiredText, str } from '@/components/forms/zod'
import { GOAL_METRICS, GOAL_STATUSES } from '@/data/schema/entities'
import type { Goal } from '@/types'
import type { GoalInput } from './service'

export const goalFormSchema = z
  .object({
    title: requiredText('Maqsad nomini kiriting').max(200),
    description: z.string().trim(),
    lifeAreaId: optionalText,
    status: z.enum(GOAL_STATUSES),
    metricType: z.enum(GOAL_METRICS),
    targetValue: optionalNumber(checks.positive),
    currentValue: optionalNumber(checks.nonNegative),
    unit: optionalText,
    startDate: optionalDate,
    targetDate: optionalDate,
    parentGoalId: optionalText,
  })
  .superRefine((v, ctx) => {
    if (v.metricType === 'numeric' && !v.targetValue) {
      ctx.addIssue({ code: 'custom', path: ['targetValue'], message: 'Sonli maqsad uchun target qiymatni kiriting' })
    }
    if (v.metricType === 'percent' && (v.currentValue ?? 0) > 100) {
      ctx.addIssue({ code: 'custom', path: ['currentValue'], message: 'Foiz 100 dan oshmasligi kerak' })
    }
    if (v.startDate && v.targetDate && v.targetDate < v.startDate) {
      ctx.addIssue({ code: 'custom', path: ['targetDate'], message: 'Yakunlanish sanasi boshlanishdan oldin bo‘lmasin' })
    }
  })

export type GoalFormInput = z.input<typeof goalFormSchema>
export type GoalFormOutput = z.output<typeof goalFormSchema>

export function goalToForm(goal: Partial<Goal> | null | undefined): GoalFormInput {
  return {
    title: goal?.title ?? '',
    description: goal?.description ?? '',
    lifeAreaId: str(goal?.lifeAreaId),
    status: goal?.status ?? 'active',
    metricType: goal?.metricType ?? 'numeric',
    targetValue: str(goal?.targetValue),
    currentValue: str(goal?.currentValue ?? ''),
    unit: str(goal?.unit),
    startDate: str(goal?.startDate),
    targetDate: str(goal?.targetDate),
    parentGoalId: str(goal?.parentGoalId),
  }
}

export function formToGoal(v: GoalFormOutput): GoalInput {
  return { ...v, currentValue: v.currentValue ?? 0 }
}

export const milestoneFormSchema = z.object({
  title: requiredText('Bosqich nomini kiriting').max(200),
  targetDate: optionalDate,
  description: optionalText,
})
export type MilestoneFormInput = z.input<typeof milestoneFormSchema>
export type MilestoneFormOutput = z.output<typeof milestoneFormSchema>
