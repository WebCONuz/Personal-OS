import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect, GoalSelect, LifeAreaSelect } from '@/components/forms/selects'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { GOAL_METRIC_LABELS, GOAL_STATUS_LABELS } from '@/constants/labels'
import { useGoalEditor } from '../editor'
import { formToGoal, goalFormSchema, goalToForm, type GoalFormInput, type GoalFormOutput } from '../schemas'
import { goalService } from '../service'

const METRIC_HINTS = {
  completion: 'Maqsad bir martalik natija: yakunlanganda “Bajarilgan” deb belgilanadi.',
  percent: 'Progress 0–100% oralig‘ida qo‘lda qayd etiladi.',
  numeric: 'Masalan: 50 000 000 so‘m, 12 ta kitob, 3 ta loyiha.',
  milestone: 'Progress bajarilgan bosqichlar ulushidan hisoblanadi.',
} as const

export function GoalFormDialog() {
  const { open, entity, defaults, close } = useGoalEditor()
  const { register, handleSubmit, reset, watch, formState } = useForm<GoalFormInput, unknown, GoalFormOutput>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: goalToForm(null),
  })
  const errors = formState.errors
  const metric = watch('metricType')

  useEffect(() => {
    if (open) reset(goalToForm(entity ?? defaults))
  }, [open, entity, defaults, reset])

  const onSubmit = handleSubmit((values) => {
    const input = formToGoal(values)
    if (entity) {
      // Current value is changed only through progress logging (keeps history intact).
      const { currentValue: _ignored, ...rest } = input
      void _ignored
      if (goalService.update(entity.id, rest)) close()
    } else if (goalService.create(input)) {
      close()
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => !o && close()}
      title={entity ? 'Maqsadni tahrirlash' : 'Yangi maqsad'}
      description="Aniq, o‘lchanadigan va muddatli maqsad haftalik rejaga oson aylanadi."
      onSubmit={onSubmit}
      size="lg"
    >
      <FormField id="goal-title" label="Maqsad" required error={errors.title?.message}>
        <Input placeholder="Masalan: Uy uchun boshlang‘ich to‘lovni yig‘ish" autoFocus {...register('title')} />
      </FormField>
      <FormField id="goal-description" label="Nega bu muhim?">
        <Textarea rows={3} placeholder="Maqsadning ma’nosi va natija mezoni" {...register('description')} />
      </FormField>
      <FormGrid>
        <FormField id="goal-area" label="Hayot sohasi">
          <LifeAreaSelect {...register('lifeAreaId')} />
        </FormField>
        <FormField id="goal-status" label="Holat">
          <EnumSelect labels={GOAL_STATUS_LABELS} {...register('status')} />
        </FormField>
        <FormField id="goal-metric" label="O‘lchov turi" hint={METRIC_HINTS[metric]} className="sm:col-span-2">
          <EnumSelect labels={GOAL_METRIC_LABELS} {...register('metricType')} />
        </FormField>
        {metric === 'numeric' && (
          <>
            <FormField id="goal-target" label="Target qiymat" required error={errors.targetValue?.message}>
              <Input inputMode="decimal" placeholder="100" {...register('targetValue')} />
            </FormField>
            <FormField id="goal-unit" label="O‘lchov birligi">
              <Input placeholder="so‘m, kitob, km…" {...register('unit')} />
            </FormField>
          </>
        )}
        {!entity && (metric === 'numeric' || metric === 'percent') && (
          <FormField
            id="goal-current"
            label={metric === 'percent' ? 'Hozirgi progress (%)' : 'Hozirgi qiymat'}
            hint="Keyinchalik progress “Progress qayd etish” orqali yangilanadi"
            error={errors.currentValue?.message}
          >
            <Input inputMode="decimal" placeholder="0" {...register('currentValue')} />
          </FormField>
        )}
        <FormField id="goal-start" label="Boshlanish sanasi" error={errors.startDate?.message}>
          <Input type="date" {...register('startDate')} />
        </FormField>
        <FormField id="goal-end" label="Yakunlanish sanasi" error={errors.targetDate?.message}>
          <Input type="date" {...register('targetDate')} />
        </FormField>
        <FormField id="goal-parent" label="Ota maqsad" hint="Ixtiyoriy: katta maqsadning bir qismi bo‘lsa">
          <GoalSelect emptyLabel="Yo‘q" excludeId={entity?.id} {...register('parentGoalId')} />
        </FormField>
      </FormGrid>
    </FormDialog>
  )
}
