import { useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { taskService } from '@/features/tasks/service'
import { useTaskEditor } from '@/features/tasks/editor'
import { useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { plannedMinutes, sortByPriority } from '@/services/analytics'
import { formatDateShort, formatMinutes, formatWeekday, weekDays, type DateKey } from '@/services/date'
import type { Task } from '@/types'

function BoardTask({ task, days }: { task: Task; days: DateKey[] }) {
  const openEdit = useTaskEditor((s) => s.openEdit)
  const done = task.status === 'done'
  const cancelled = task.status === 'cancelled'
  return (
    <li className={cn('rounded-md border bg-card p-2 text-sm shadow-xs', cancelled && 'opacity-60')}>
      <div className="flex items-start gap-2">
        <Checkbox
          checked={done}
          disabled={cancelled}
          onCheckedChange={() => taskService.toggleDone(task)}
          aria-label={`“${task.title}” bajarilganini belgilash`}
          className="mt-0.5"
        />
        <button
          type="button"
          onClick={() => openEdit(task)}
          className={cn('min-w-0 flex-1 text-left leading-snug hover:underline', (done || cancelled) && 'text-muted-foreground line-through')}
        >
          {task.priority === 'high' && !done && <span className="sr-only">Yuqori ustuvorlik: </span>}
          {task.title}
        </button>
        {task.priority === 'high' && !done && <span className="mt-1 size-2 shrink-0 rounded-full bg-warning" title="Yuqori ustuvorlik" aria-hidden="true" />}
      </div>
      <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
        {task.estimatedMinutes && <span className="tabular">{formatMinutes(task.estimatedMinutes)}</span>}
        <NativeSelect
          size="sm"
          aria-label={`“${task.title}” kunini tanlash`}
          value={task.scheduledDate ?? ''}
          onChange={(e) => taskService.scheduleOn(task.id, e.target.value || undefined)}
          className="w-full [&_select]:h-6 [&_select]:text-xs"
        >
          <NativeSelectOption value="">Kunsiz</NativeSelectOption>
          {days.map((d) => (
            <NativeSelectOption key={d} value={d}>
              {formatWeekday(d, 'EEEEEE')} {d.slice(8).replace(/^0/, '')}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </li>
  )
}

/** Distributes the week's tasks across days. Changing a task's day uses an accessible select (no drag-only UX). */
export function WeekBoard({ week, tasks }: { week: DateKey; tasks: Task[] }) {
  const today = useToday()
  const days = useMemo(() => weekDays(week), [week])
  const unscheduled = sortByPriority(tasks.filter((t) => !t.scheduledDate))
  const columns = days.map((d) => ({ day: d, tasks: sortByPriority(tasks.filter((t) => t.scheduledDate === d)) }))

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <section aria-label="Kunga taqsimlanmagan vazifalar" className="flex flex-col gap-2 rounded-xl border border-dashed bg-muted/30 p-2.5">
        <header className="flex items-baseline justify-between px-0.5">
          <h3 className="text-sm font-medium">Kunsiz</h3>
          <span className="tabular text-xs text-muted-foreground">{unscheduled.length}</span>
        </header>
        <ul className="flex flex-col gap-2">
          {unscheduled.map((t) => (
            <BoardTask key={t.id} task={t} days={days} />
          ))}
        </ul>
        {unscheduled.length === 0 && <p className="px-0.5 text-xs text-muted-foreground">Hammasi kunlarga taqsimlangan</p>}
      </section>
      {columns.map(({ day, tasks: list }) => {
        const minutes = plannedMinutes(list)
        const isToday = day === today
        return (
          <section
            key={day}
            aria-label={`${formatWeekday(day)}, ${formatDateShort(day)}`}
            className={cn('flex flex-col gap-2 rounded-xl border bg-muted/30 p-2.5', isToday && 'border-primary/50 bg-accent/40')}
          >
            <header className="flex items-baseline justify-between gap-2 px-0.5">
              <h3 className="text-sm font-medium capitalize">
                {formatWeekday(day, 'EEEEEE')} <span className="font-normal text-muted-foreground">{formatDateShort(day)}</span>
              </h3>
              {minutes > 0 && <span className="tabular text-xs text-muted-foreground">{formatMinutes(minutes)}</span>}
            </header>
            <ul className="flex flex-col gap-2">
              {list.map((t) => (
                <BoardTask key={t.id} task={t} days={days} />
              ))}
            </ul>
            {list.length === 0 && <p className="px-0.5 text-xs text-muted-foreground">Bo‘sh — dam olish ham reja</p>}
          </section>
        )
      })}
    </div>
  )
}
