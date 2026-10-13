import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect, LifeAreaSelect } from '@/components/forms/selects'
import { checks, optionalText, requiredNumber, requiredText, str } from '@/components/forms/zod'
import { Input } from '@/components/ui/input'
import { HABIT_FREQUENCY_LABELS } from '@/constants/labels'
import { HABIT_FREQUENCIES } from '@/data/schema/entities'
import type { Habit } from '@/types'
import { useHabitEditor } from '../editor'
import { habitService } from '../service'

const schema = z.object({
  title: requiredText('Odat nomini kiriting').max(120),
  description: optionalText,
  lifeAreaId: optionalText,
  frequency: z.enum(HABIT_FREQUENCIES),
  targetPerWeek: requiredNumber(checks.intRange(1, 7)),
})
type In = z.input<typeof schema>
type Out = z.output<typeof schema>

function toForm(h: Partial<Habit> | null): In {
  return {
    title: h?.title ?? '',
    description: str(h?.description),
    lifeAreaId: str(h?.lifeAreaId),
    frequency: h?.frequency ?? 'daily',
    targetPerWeek: str(h?.targetPerWeek ?? 3),
  }
}

export function HabitFormDialog() {
  const { open, entity, defaults, close } = useHabitEditor()
  const { register, handleSubmit, reset, watch, formState } = useForm<In, unknown, Out>({ resolver: zodResolver(schema), defaultValues: toForm(null) })
  const frequency = watch('frequency')
  useEffect(() => {
    if (open) reset(toForm(entity ?? defaults))
  }, [open, entity, defaults, reset])

  const onSubmit = handleSubmit((v) => {
    const ok = entity ? habitService.update(entity.id, v) : habitService.create({ ...v, active: true })
    if (ok) close()
  })

  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Odatni tahrirlash' : 'Yangi odat'} onSubmit={onSubmit}>
      <FormField id="habit-title" label="Odat" required error={formState.errors.title?.message}>
        <Input placeholder="Masalan: 20 daqiqa ingliz tili" autoFocus {...register('title')} />
      </FormField>
      <FormField id="habit-desc" label="Izoh">
        <Input placeholder="Qachon va qayerda?" {...register('description')} />
      </FormField>
      <FormGrid>
        <FormField id="habit-area" label="Hayot sohasi">
          <LifeAreaSelect {...register('lifeAreaId')} />
        </FormField>
        <FormField id="habit-frequency" label="Chastota">
          <EnumSelect labels={HABIT_FREQUENCY_LABELS} {...register('frequency')} />
        </FormField>
        {frequency === 'weekly' && (
          <FormField id="habit-target" label="Haftalik target (kun)" error={formState.errors.targetPerWeek?.message} hint="Haftada necha kun bajarish">
            <Input type="number" min={1} max={7} {...register('targetPerWeek')} />
          </FormField>
        )}
      </FormGrid>
    </FormDialog>
  )
}
