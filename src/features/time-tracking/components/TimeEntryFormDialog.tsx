import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { LifeAreaSelect, ProjectSelect, TaskSelect } from '@/components/forms/selects'
import { checks, optionalText, requiredDate, requiredNumber, str } from '@/components/forms/zod'
import { Input } from '@/components/ui/input'
import { useToday } from '@/hooks/useData'
import { useTimeEntryEditor } from '../editor'
import { MAX_ENTRY_MINUTES, timeEntryService } from '../service'

const schema = z.object({
  date: requiredDate,
  durationMinutes: requiredNumber(checks.intRange(1, MAX_ENTRY_MINUTES)),
  taskId: optionalText,
  projectId: optionalText,
  lifeAreaId: optionalText,
  note: optionalText,
})
type In = z.input<typeof schema>
type Out = z.output<typeof schema>

export function TimeEntryFormDialog() {
  const { open, entity, defaults, close } = useTimeEntryEditor()
  const today = useToday()
  const { register, handleSubmit, reset, formState } = useForm<In, unknown, Out>({ resolver: zodResolver(schema) })
  useEffect(() => {
    if (!open) return
    const e = entity ?? defaults
    reset({
      date: e?.date ?? today,
      durationMinutes: str(e?.durationMinutes),
      taskId: str(e?.taskId),
      projectId: str(e?.projectId),
      lifeAreaId: str(e?.lifeAreaId),
      note: str(e?.note),
    })
  }, [open, entity, defaults, reset, today])

  const onSubmit = handleSubmit((v) => {
    const ok = entity ? timeEntryService.update(entity.id, v) : timeEntryService.create({ ...v, source: 'manual' })
    if (ok) close()
  })

  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Vaqt yozuvini tahrirlash' : 'Vaqtni qo‘lda kiritish'} onSubmit={onSubmit}>
      <FormGrid>
        <FormField id="te-date" label="Sana" required error={formState.errors.date?.message}>
          <Input type="date" max={today} {...register('date')} />
        </FormField>
        <FormField id="te-minutes" label="Davomiyligi (daqiqa)" required error={formState.errors.durationMinutes?.message}>
          <Input type="number" min={1} max={MAX_ENTRY_MINUTES} placeholder="45" autoFocus {...register('durationMinutes')} />
        </FormField>
        <FormField id="te-task" label="Vazifa">
          <TaskSelect {...register('taskId')} />
        </FormField>
        <FormField id="te-project" label="Loyiha">
          <ProjectSelect {...register('projectId')} />
        </FormField>
        <FormField id="te-area" label="Hayot sohasi" hint="Bo‘sh qolsa vazifa yoki loyihadan olinadi">
          <LifeAreaSelect {...register('lifeAreaId')} />
        </FormField>
        <FormField id="te-note" label="Izoh">
          <Input placeholder="Nima ustida ishladingiz?" {...register('note')} />
        </FormField>
      </FormGrid>
    </FormDialog>
  )
}
