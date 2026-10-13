import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect, GoalSelect, LearningItemSelect, LifeAreaSelect, OptionsSelect, ProjectSelect } from '@/components/forms/selects'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/constants/labels'
import { useToday } from '@/hooks/useData'
import { addDaysKey, formatWeekRange, startOfWeekKey } from '@/services/date'
import { useTaskEditor } from '../editor'
import { formToTask, taskFormSchema, taskToForm, type TaskFormInput, type TaskFormOutput } from '../schemas'
import { taskService } from '../service'

export function TaskFormDialog() {
  const { open, entity, defaults, close } = useTaskEditor()
  const today = useToday()
  const form = useForm<TaskFormInput, unknown, TaskFormOutput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: taskToForm(null),
  })
  const { register, handleSubmit, reset, watch, formState } = form
  const errors = formState.errors

  useEffect(() => {
    if (open) reset(taskToForm(entity ?? defaults))
  }, [open, entity, defaults, reset])

  const currentWeek = startOfWeekKey(today)
  const weekValue = watch('weekStart')
  const weekOptions = useMemo(() => {
    const opts = [
      { value: currentWeek, label: `Shu hafta (${formatWeekRange(currentWeek)})` },
      { value: addDaysKey(currentWeek, 7), label: `Keyingi hafta (${formatWeekRange(addDaysKey(currentWeek, 7))})` },
    ]
    if (weekValue && !opts.some((o) => o.value === weekValue)) {
      opts.unshift({ value: weekValue, label: formatWeekRange(weekValue) })
    }
    return opts
  }, [currentWeek, weekValue])

  const onSubmit = handleSubmit((values) => {
    const input = formToTask(values)
    const ok = entity ? taskService.update(entity.id, input) : taskService.create(input)
    if (ok) close()
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => !o && close()}
      title={entity ? 'Vazifani tahrirlash' : 'Yangi vazifa'}
      onSubmit={onSubmit}
      size="lg"
    >
      <FormField id="task-title" label="Nomi" required error={errors.title?.message}>
        <Input placeholder="Masalan: NestJS auth modulini yakunlash" autoFocus {...register('title')} />
      </FormField>
      <FormField id="task-description" label="Tavsif" error={errors.description?.message}>
        <Textarea rows={3} placeholder="Qisqa izoh yoki natija mezoni" {...register('description')} />
      </FormField>
      <FormGrid>
        <FormField id="task-status" label="Holat">
          <EnumSelect labels={TASK_STATUS_LABELS} {...register('status')} />
        </FormField>
        <FormField id="task-priority" label="Ustuvorlik">
          <EnumSelect labels={TASK_PRIORITY_LABELS} {...register('priority')} />
        </FormField>
        <FormField id="task-area" label="Hayot sohasi">
          <LifeAreaSelect {...register('lifeAreaId')} />
        </FormField>
        <FormField id="task-estimate" label="Taxminiy vaqt (daqiqa)" error={errors.estimatedMinutes?.message}>
          <Input type="number" inputMode="numeric" min={1} max={1440} placeholder="60" {...register('estimatedMinutes')} />
        </FormField>
        <FormField id="task-goal" label="Maqsad">
          <GoalSelect {...register('goalId')} />
        </FormField>
        <FormField id="task-project" label="Loyiha">
          <ProjectSelect {...register('projectId')} />
        </FormField>
        <FormField id="task-learning" label="O‘quv resursi" hint="Mashg‘ulot sifatida rejalashtirilsa" className="sm:col-span-2">
          <LearningItemSelect {...register('learningItemId')} />
        </FormField>
        <FormField id="task-week" label="Haftalik reja" hint="Vazifani qaysi hafta rejasiga kiritish">
          <OptionsSelect emptyLabel="Rejalashtirilmagan" options={weekOptions} {...register('weekStart')} />
        </FormField>
        <FormField
          id="task-scheduled"
          label="Bajarish kuni"
          hint="Kun tanlansa, vazifa avtomatik o‘sha hafta rejasiga tushadi"
          error={errors.scheduledDate?.message}
        >
          <Input type="date" {...register('scheduledDate')} />
        </FormField>
        <FormField id="task-due" label="Muddat" error={errors.dueDate?.message}>
          <Input type="date" {...register('dueDate')} />
        </FormField>
      </FormGrid>
    </FormDialog>
  )
}
