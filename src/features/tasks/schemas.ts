import { z } from 'zod'
import { checks, optionalDate, optionalNumber, optionalText, requiredText, str } from '@/components/forms/zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/data/schema/entities'
import type { Task } from '@/types'
import type { TaskInput } from './service'

export const taskFormSchema = z.object({
  title: requiredText('Vazifa nomini kiriting').max(200, 'Nom juda uzun'),
  description: z.string().trim(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  lifeAreaId: optionalText,
  goalId: optionalText,
  projectId: optionalText,
  learningItemId: optionalText,
  weekStart: optionalDate,
  scheduledDate: optionalDate,
  dueDate: optionalDate,
  estimatedMinutes: optionalNumber(checks.intRange(1, 1440)),
})

export type TaskFormInput = z.input<typeof taskFormSchema>
export type TaskFormOutput = z.output<typeof taskFormSchema>

export function taskToForm(task: Partial<Task> | null | undefined): TaskFormInput {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    lifeAreaId: str(task?.lifeAreaId),
    goalId: str(task?.goalId),
    projectId: str(task?.projectId),
    learningItemId: str(task?.learningItemId),
    weekStart: str(task?.weekStart),
    scheduledDate: str(task?.scheduledDate),
    dueDate: str(task?.dueDate),
    estimatedMinutes: str(task?.estimatedMinutes),
  }
}

export function formToTask(values: TaskFormOutput): TaskInput {
  return { ...values }
}
