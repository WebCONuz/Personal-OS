import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect, GoalSelect, LifeAreaSelect } from '@/components/forms/selects'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PROJECT_KIND_LABELS, PROJECT_STATUS_LABELS } from '@/constants/labels'
import { useProjectEditor } from '../editor'
import { projectFormSchema, projectToForm, type ProjectFormInput, type ProjectFormOutput } from '../schemas'
import { projectService } from '../service'

export function ProjectFormDialog() {
  const { open, entity, defaults, close } = useProjectEditor()
  const { register, handleSubmit, reset, formState } = useForm<ProjectFormInput, unknown, ProjectFormOutput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: projectToForm(null),
  })
  const errors = formState.errors

  useEffect(() => {
    if (open) reset(projectToForm(entity ?? defaults))
  }, [open, entity, defaults, reset])

  const onSubmit = handleSubmit((values) => {
    const ok = entity ? projectService.update(entity.id, values) : projectService.create(values)
    if (ok) close()
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => !o && close()}
      title={entity ? 'Loyihani tahrirlash' : 'Yangi loyiha'}
      onSubmit={onSubmit}
      size="lg"
    >
      <FormField id="project-title" label="Nomi" required error={errors.title?.message}>
        <Input placeholder="Masalan: Freelance CRM MVP" autoFocus {...register('title')} />
      </FormField>
      <FormField id="project-description" label="Tavsif">
        <Textarea rows={3} placeholder="Loyiha nima uchun va qanday natija beradi?" {...register('description')} />
      </FormField>
      <FormField id="project-next" label="Keyingi eng kichik qadam" hint="Bugun 30 daqiqada bajarsa bo‘ladigan aniq harakat">
        <Input placeholder="Masalan: landing sahifa uchun 3 ta sarlavha yozish" {...register('nextStep')} />
      </FormField>
      <FormGrid>
        <FormField id="project-kind" label="Turi">
          <EnumSelect labels={PROJECT_KIND_LABELS} {...register('kind')} />
        </FormField>
        <FormField id="project-status" label="Holat">
          <EnumSelect labels={PROJECT_STATUS_LABELS} {...register('status')} />
        </FormField>
        <FormField id="project-area" label="Hayot sohasi">
          <LifeAreaSelect {...register('lifeAreaId')} />
        </FormField>
        <FormField id="project-goal" label="Maqsad">
          <GoalSelect {...register('goalId')} />
        </FormField>
        <FormField id="project-start" label="Boshlanish" error={errors.startDate?.message}>
          <Input type="date" {...register('startDate')} />
        </FormField>
        <FormField id="project-target" label="Muddat" error={errors.targetDate?.message}>
          <Input type="date" {...register('targetDate')} />
        </FormField>
      </FormGrid>
    </FormDialog>
  )
}
