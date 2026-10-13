import { z } from 'zod'
import { optionalDate, optionalText, requiredText, str } from '@/components/forms/zod'
import { PROJECT_KINDS, PROJECT_STATUSES } from '@/data/schema/entities'
import type { Project } from '@/types'

export const projectFormSchema = z
  .object({
    title: requiredText('Loyiha nomini kiriting').max(200),
    description: z.string().trim(),
    kind: z.enum(PROJECT_KINDS),
    status: z.enum(PROJECT_STATUSES),
    lifeAreaId: optionalText,
    goalId: optionalText,
    startDate: optionalDate,
    targetDate: optionalDate,
    nextStep: optionalText,
  })
  .refine((v) => !v.startDate || !v.targetDate || v.targetDate >= v.startDate, {
    path: ['targetDate'],
    message: 'Muddat boshlanish sanasidan keyin bo‘lishi kerak',
  })

export type ProjectFormInput = z.input<typeof projectFormSchema>
export type ProjectFormOutput = z.output<typeof projectFormSchema>

export function projectToForm(p: Partial<Project> | null | undefined): ProjectFormInput {
  return {
    title: p?.title ?? '',
    description: p?.description ?? '',
    kind: p?.kind ?? 'personal',
    status: p?.status ?? 'active',
    lifeAreaId: str(p?.lifeAreaId),
    goalId: str(p?.goalId),
    startDate: str(p?.startDate),
    targetDate: str(p?.targetDate),
    nextStep: str(p?.nextStep),
  }
}
