import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { GoalSelect, LifeAreaSelect, OptionsSelect, ProjectSelect } from '@/components/forms/selects'
import { optionalText, requiredText, str } from '@/components/forms/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCollection } from '@/hooks/useData'
import type { KnowledgeNote } from '@/types'
import { useNoteEditor } from '../editor'
import { noteService, parseTags } from '../service'

const schema = z.object({
  title: requiredText('Sarlavha kiriting').max(200),
  content: z.string(),
  tags: z.string(),
  lifeAreaId: optionalText,
  goalId: optionalText,
  projectId: optionalText,
  learningItemId: optionalText,
})
type In = z.input<typeof schema>
type Out = z.output<typeof schema>

function toForm(n: Partial<KnowledgeNote> | null): In {
  return {
    title: n?.title ?? '',
    content: n?.content ?? '',
    tags: (n?.tags ?? []).join(', '),
    lifeAreaId: str(n?.lifeAreaId),
    goalId: str(n?.linkedGoalIds?.[0]),
    projectId: str(n?.linkedProjectIds?.[0]),
    learningItemId: str(n?.linkedLearningItemIds?.[0]),
  }
}

export function NoteFormDialog() {
  const { open, entity, defaults, close } = useNoteEditor()
  const learningItems = useCollection('learningItems')
  const { register, handleSubmit, reset, formState } = useForm<In, unknown, Out>({ resolver: zodResolver(schema), defaultValues: toForm(null) })
  useEffect(() => {
    if (open) reset(toForm(entity ?? defaults))
  }, [open, entity, defaults, reset])

  const onSubmit = handleSubmit((v) => {
    // Keep any additional links that the simple form does not show.
    const keep = <T,>(list: T[] | undefined) => (list ?? []).slice(1)
    const input = {
      title: v.title,
      content: v.content,
      tags: parseTags(v.tags),
      lifeAreaId: v.lifeAreaId,
      linkedGoalIds: [...(v.goalId ? [v.goalId] : []), ...keep(entity?.linkedGoalIds)],
      linkedProjectIds: [...(v.projectId ? [v.projectId] : []), ...keep(entity?.linkedProjectIds)],
      linkedLearningItemIds: [...(v.learningItemId ? [v.learningItemId] : []), ...keep(entity?.linkedLearningItemIds)],
    }
    const ok = entity ? noteService.update(entity.id, input) : noteService.create(input)
    if (ok) close()
  })

  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Qaydni tahrirlash' : 'Yangi qayd'} onSubmit={onSubmit} size="lg">
      <FormField id="note-title" label="Sarlavha" required error={formState.errors.title?.message}>
        <Input placeholder="Masalan: NestJS guard va interceptor farqi" autoFocus {...register('title')} />
      </FormField>
      <FormField id="note-content" label="Matn" hint="Markdown qo‘llab-quvvatlanadi: **qalin**, `kod`, - ro‘yxat, ## sarlavha">
        <Textarea rows={10} className="font-mono text-sm" {...register('content')} />
      </FormField>
      <FormField id="note-tags" label="Teglar" hint="Vergul bilan ajrating">
        <Input placeholder="nestjs, backend, auth" {...register('tags')} />
      </FormField>
      <FormGrid>
        <FormField id="note-area" label="Hayot sohasi">
          <LifeAreaSelect {...register('lifeAreaId')} />
        </FormField>
        <FormField id="note-goal" label="Maqsad">
          <GoalSelect {...register('goalId')} />
        </FormField>
        <FormField id="note-project" label="Loyiha">
          <ProjectSelect {...register('projectId')} />
        </FormField>
        <FormField id="note-learning" label="O‘quv resursi">
          <OptionsSelect emptyLabel="Bog‘lanmagan" options={learningItems.map((l) => ({ value: l.id, label: l.title }))} {...register('learningItemId')} />
        </FormField>
      </FormGrid>
    </FormDialog>
  )
}
