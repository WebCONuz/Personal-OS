import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, FlagIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { confirmDelete } from '@/components/shared/confirm'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { formatDate, type DateKey } from '@/services/date'
import type { Milestone } from '@/types'
import { milestoneFormSchema, type MilestoneFormInput, type MilestoneFormOutput } from '../schemas'
import { milestoneService } from '../service'

interface MilestoneListProps {
  goalId?: string
  projectId?: string
}

/** Milestones of a goal or a project, with inline add / edit / complete / delete. */
export function MilestoneList({ goalId, projectId }: MilestoneListProps) {
  const all = useCollection('milestones')
  const today = useToday()
  const [editingId, setEditingId] = useState<string | null>(null)
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
          {milestones.map((m) =>
            editingId === m.id ? (
              <MilestoneEditRow key={m.id} milestone={m} onDone={() => setEditingId(null)} />
            ) : (
              <MilestoneRow key={m.id} milestone={m} today={today} onEdit={() => setEditingId(m.id)} />
            ),
          )}
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

function MilestoneRow({ milestone: m, today, onEdit }: { milestone: Milestone; today: DateKey; onEdit: () => void }) {
  const done = m.status === 'done'
  const late = !done && m.targetDate && m.targetDate < today
  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
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
      <div className="flex opacity-60 group-hover:opacity-100 focus-within:opacity-100">
        <Button variant="ghost" size="icon-sm" aria-label={`“${m.title}” bosqichini tahrirlash`} onClick={onEdit}>
          <PencilIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`“${m.title}” bosqichini o‘chirish`}
          onClick={async () => {
            if (await confirmDelete('Bosqich')) milestoneService.remove(m.id)
          }}
        >
          <Trash2Icon />
        </Button>
      </div>
    </li>
  )
}

function MilestoneEditRow({ milestone: m, onDone }: { milestone: Milestone; onDone: () => void }) {
  const { register, handleSubmit, formState } = useForm<MilestoneFormInput, unknown, MilestoneFormOutput>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: { title: m.title, targetDate: m.targetDate ?? '', description: m.description ?? '' },
  })

  // Only the edited fields are patched; an emptied date clears targetDate.
  const onSubmit = handleSubmit((v) => {
    if (milestoneService.update(m.id, { title: v.title, targetDate: v.targetDate })) onDone()
  })

  return (
    <li className="rounded-lg bg-muted/50 px-2 py-1.5">
      <form
        onSubmit={onSubmit}
        onKeyDown={(e) => e.key === 'Escape' && onDone()}
        className="flex flex-col gap-2 sm:flex-row sm:items-start"
        noValidate
        aria-label={`“${m.title}” bosqichini tahrirlash`}
      >
        <div className="flex-1">
          <Input
            aria-label="Bosqich nomi"
            autoFocus
            aria-invalid={formState.errors.title ? true : undefined}
            {...register('title')}
          />
          {formState.errors.title && <p className="mt-1 text-xs text-destructive">{formState.errors.title.message}</p>}
        </div>
        <Input type="date" aria-label="Bosqich sanasi" className="sm:w-40" {...register('targetDate')} />
        <div className="flex gap-1">
          <Button type="submit" size="icon" aria-label="Saqlash">
            <CheckIcon />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Bekor qilish" onClick={onDone}>
            <XIcon />
          </Button>
        </div>
      </form>
    </li>
  )
}
