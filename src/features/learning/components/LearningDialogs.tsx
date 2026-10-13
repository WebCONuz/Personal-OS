import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect, GoalSelect, LifeAreaSelect, OptionsSelect, ProjectSelect } from '@/components/forms/selects'
import { optionalText, optionalUrl, requiredText, str } from '@/components/forms/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LEARNING_STATUS_LABELS, LEARNING_TYPE_LABELS } from '@/constants/labels'
import { LEARNING_STATUSES, LEARNING_TYPES } from '@/data/schema/entities'
import { useCollection } from '@/hooks/useData'
import { useLearningEditor, useVocabEditor } from '../editor'
import { learningService, vocabService } from '../service'

const learningSchema = z.object({
  title: requiredText('Nomini kiriting').max(200),
  type: z.enum(LEARNING_TYPES),
  status: z.enum(LEARNING_STATUSES),
  url: optionalUrl,
  notes: optionalText,
  outcome: optionalText,
  lifeAreaId: optionalText,
  goalId: optionalText,
  projectId: optionalText,
  skillId: optionalText,
})
type LIn = z.input<typeof learningSchema>
type LOut = z.output<typeof learningSchema>

function LearningFormDialog() {
  const { open, entity, defaults, close } = useLearningEditor()
  const skills = useCollection('skills')
  const { register, handleSubmit, reset, formState } = useForm<LIn, unknown, LOut>({ resolver: zodResolver(learningSchema) })
  useEffect(() => {
    if (!open) return
    const e = entity ?? defaults
    reset({
      title: e?.title ?? '',
      type: e?.type ?? 'course',
      status: e?.status ?? 'to_learn',
      url: str(e?.url),
      notes: str(e?.notes),
      outcome: str(e?.outcome),
      lifeAreaId: e ? str(e.lifeAreaId) : 'area-learning',
      goalId: str(e?.goalId),
      projectId: str(e?.projectId),
      skillId: str(e?.skillId),
    })
  }, [open, entity, defaults, reset])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? learningService.update(entity.id, v) : learningService.create(v)
    if (ok) close()
  })
  const e = formState.errors
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Resursni tahrirlash' : 'Yangi o‘quv resursi'} onSubmit={onSubmit} size="lg">
      <FormField id="li-title" label="Nomi" required error={e.title?.message}>
        <Input autoFocus placeholder="Masalan: Designing Data-Intensive Applications" {...register('title')} />
      </FormField>
      <FormGrid>
        <FormField id="li-type" label="Turi">
          <EnumSelect labels={LEARNING_TYPE_LABELS} {...register('type')} />
        </FormField>
        <FormField id="li-status" label="Holat">
          <EnumSelect labels={LEARNING_STATUS_LABELS} {...register('status')} />
        </FormField>
      </FormGrid>
      <FormField id="li-url" label="Manba havolasi" error={e.url?.message}>
        <Input type="url" placeholder="https://…" {...register('url')} />
      </FormField>
      <FormField id="li-notes" label="Qisqa qaydlar">
        <Textarea rows={3} {...register('notes')} />
      </FormField>
      <FormField id="li-outcome" label="Amaliy natija" hint="O‘rganilganini qayerda qo‘lladingiz? Loyiha, kod, maqola…">
        <Input {...register('outcome')} />
      </FormField>
      <FormGrid className="sm:grid-cols-3">
        <FormField id="li-area" label="Soha">
          <LifeAreaSelect {...register('lifeAreaId')} />
        </FormField>
        <FormField id="li-goal" label="Maqsad">
          <GoalSelect {...register('goalId')} />
        </FormField>
        <FormField id="li-project" label="Loyiha">
          <ProjectSelect {...register('projectId')} />
        </FormField>
      </FormGrid>
      <FormField id="li-skill" label="Rivojlantiradigan ko‘nikma" hint="Karyera → O‘rganish yo‘nalishlari bo‘limida guruhlanadi">
        <OptionsSelect emptyLabel="Bog‘lanmagan" options={skills.map((s) => ({ value: s.id, label: s.name }))} {...register('skillId')} />
      </FormField>
    </FormDialog>
  )
}

const vocabSchema = z.object({ phrase: requiredText('Ibora yoki so‘zni kiriting').max(200), meaning: z.string().trim(), example: optionalText })
type VIn = z.input<typeof vocabSchema>
type VOut = z.output<typeof vocabSchema>

function VocabFormDialog() {
  const { open, entity, close } = useVocabEditor()
  const { register, handleSubmit, reset, formState } = useForm<VIn, unknown, VOut>({ resolver: zodResolver(vocabSchema) })
  useEffect(() => {
    if (open) reset({ phrase: entity?.phrase ?? '', meaning: entity?.meaning ?? '', example: str(entity?.example) })
  }, [open, entity, reset])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? vocabService.update(entity.id, v) : vocabService.create({ ...v, learned: false })
    if (ok) close()
  })
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Iborani tahrirlash' : 'Yangi ibora'} onSubmit={onSubmit}>
      <FormField id="v-phrase" label="Ibora / so‘z" required error={formState.errors.phrase?.message}>
        <Input autoFocus placeholder="to get the hang of something" {...register('phrase')} />
      </FormField>
      <FormField id="v-meaning" label="Ma’nosi">
        <Input placeholder="biror narsani o‘zlashtirib olmoq" {...register('meaning')} />
      </FormField>
      <FormField id="v-example" label="Misol">
        <Textarea rows={2} {...register('example')} />
      </FormField>
    </FormDialog>
  )
}

export function LearningDialogs() {
  return (
    <>
      <LearningFormDialog />
      <VocabFormDialog />
    </>
  )
}
