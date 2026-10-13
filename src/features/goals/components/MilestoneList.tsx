import { zodResolver } from '@hookform/resolvers/zod'
import { FlagIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { confirmDelete } from '@/components/shared/confirm'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { formatDate } from '@/services/date'
import { milestoneFormSchema, type MilestoneFormInput, type MilestoneFormOutput } from '../schemas'
import { milestoneService } from '../service'

interface MilestoneListProps {
  goalId?: string
  projectId?: string
}

/** Milestones of a goal or a project, with inline add / complete / delete. */
export function MilestoneList({ goalId, projectId }: MilestoneListProps) {
  const all = useCollection('milestones')
  const today = useToday()
  const milestones = useMemo(
    () =>
      all
        .filter((m) => (goalId ? m.goalId === goalId : m.projectId === projectId))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [all, goalId, projectId],
  )
  const { register, handleSubmit, reset, formState } = useForm<MilestoneFormInput, unknown, MilestoneFormOutput>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: { title: '', targetDate: '', description: '' },
  })

  const onSubmit = handleSubmit((v) => {
    if (milestoneService.create({ ...v, goalId, projectId })) reset({ title: '', targetDate: '', description: '' })
  })

  return (
    <div className="flex flex-col gap-3">
      {milestones.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {milestones.map((m) => {
            const done = m.status === 'done'
            const late = !done && m.targetDate && m.targetDate < today
            return (
              <li key={m.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <Checkbox
                  checked={done}
                  onCheckedChange={() => milestoneService.toggle(m.id)}
                  aria-label={done ? `“${m.title}” bosqichini qayta ochish` : `“${m.title}” bosqichini bajarilgan deb belgilash`}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm', done && 'text-muted-foreground line-through')}>{m.title}</p>
                  {m.targetDate && (
                    <p className={cn('text-xs text-muted-foreground', late && 'text-warning-foreground')}>
                      {late ? 'Rejadagi sana o‘tgan: ' : ''}
                      {formatDate(m.targetDate, 'd MMM yyyy')}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`“${m.title}” bosqichini o‘chirish`}
                  className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={async () => {
                    if (await confirmDelete('Bosqich')) milestoneService.remove(m.id)
                  }}
                >
                  <Trash2Icon />
                </Button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FlagIcon className="size-4" aria-hidden="true" /> Bosqichlar yo‘q. Katta natijani 3–5 ta oraliq bosqichga bo‘ling.
        </p>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row" noValidate aria-label="Yangi bosqich qo‘shish">
        <div className="flex-1">
          <Input
            placeholder="Yangi bosqich nomi"
            aria-label="Bosqich nomi"
            aria-invalid={formState.errors.title ? true : undefined}
            {...register('title')}
          />
          {formState.errors.title && <p className="mt-1 text-xs text-destructive">{formState.errors.title.message}</p>}
        </div>
        <Input type="date" aria-label="Bosqich sanasi" className="sm:w-40" {...register('targetDate')} />
        <Button type="submit" variant="outline">
          <PlusIcon /> Qo‘shish
        </Button>
      </form>
    </div>
  )
}
