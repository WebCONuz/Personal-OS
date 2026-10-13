import {
  ArrowRightIcon,
  CalendarIcon,
  CalendarXIcon,
  ClockIcon,
  FolderIcon,
  GraduationCapIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  TargetIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react'
import { confirmDelete } from '@/components/shared/confirm'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { timerService } from '@/features/time-tracking/service'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { isOverdue } from '@/services/analytics'
import { addDaysKey, formatDateShort, formatMinutes, formatWeekday, relativeDayLabel, startOfWeekKey } from '@/services/date'
import type { Task } from '@/types'
import { useTaskEditor } from '../editor'
import { taskService } from '../service'

interface TaskItemProps {
  task: Task
  /** Hide goal/project chips when rendered inside that goal/project. */
  hideLinks?: boolean
  showSchedule?: boolean
  className?: string
}

export function TaskItem({ task, hideLinks, showSchedule = true, className }: TaskItemProps) {
  const today = useToday()
  const goals = useCollection('goals')
  const projects = useCollection('projects')
  const learningItems = useCollection('learningItems')
  const openEdit = useTaskEditor((s) => s.openEdit)
  const goal = !hideLinks && task.goalId ? goals.find((g) => g.id === task.goalId) : undefined
  const project = !hideLinks && task.projectId ? projects.find((p) => p.id === task.projectId) : undefined
  const learning = !hideLinks && task.learningItemId ? learningItems.find((l) => l.id === task.learningItemId) : undefined
  const done = task.status === 'done'
  const cancelled = task.status === 'cancelled'
  const overdue = isOverdue(task, today)
  const thisWeek = startOfWeekKey(today)

  const remove = async () => {
    if (await confirmDelete('Vazifa', 'Vazifa o‘chiriladi. Unga bog‘langan vaqt yozuvlari saqlanib qoladi, lekin vazifadan ajratiladi.')) {
      taskService.remove(task.id)
    }
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40',
        cancelled && 'opacity-60',
        className,
      )}
    >
      <Checkbox
        checked={done}
        disabled={cancelled}
        onCheckedChange={() => taskService.toggleDone(task)}
        aria-label={done ? `“${task.title}” vazifasini qayta ochish` : `“${task.title}” vazifasini bajarilgan deb belgilash`}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => openEdit(task)}
          className={cn(
            'block max-w-full truncate text-left text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none',
            (done || cancelled) && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.priority === 'high' && !done && <StatusBadge tone="warning">Yuqori</StatusBadge>}
          {task.status === 'in_progress' && <StatusBadge tone="primary">Jarayonda</StatusBadge>}
          {cancelled && <StatusBadge tone="muted">Bekor qilingan</StatusBadge>}
          <LifeAreaBadge areaId={task.lifeAreaId} />
          {goal && (
            <span className="inline-flex items-center gap-1">
              <TargetIcon className="size-3.5" aria-hidden="true" />
              <span className="max-w-40 truncate">{goal.title}</span>
            </span>
          )}
          {project && (
            <span className="inline-flex items-center gap-1">
              <FolderIcon className="size-3.5" aria-hidden="true" />
              <span className="max-w-40 truncate">{project.title}</span>
            </span>
          )}
          {learning && (
            <span className="inline-flex items-center gap-1">
              <GraduationCapIcon className="size-3.5" aria-hidden="true" />
              <span className="max-w-40 truncate">{learning.title}</span>
            </span>
          )}
          {showSchedule && task.scheduledDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="size-3.5" aria-hidden="true" />
              {task.scheduledDate === today ? 'Bugun' : `${formatWeekday(task.scheduledDate, 'EEEEEE')}, ${formatDateShort(task.scheduledDate)}`}
            </span>
          )}
          {task.dueDate && !done && (
            <span className={cn('inline-flex items-center gap-1', overdue && 'font-medium text-warning-foreground')}>
              <CalendarXIcon className="size-3.5" aria-hidden="true" />
              {overdue ? `Muddat: ${relativeDayLabel(task.dueDate, today)}` : `Muddat: ${formatDateShort(task.dueDate)}`}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" aria-hidden="true" />
              {formatMinutes(task.estimatedMinutes)}
            </span>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`“${task.title}” amallari`} className="shrink-0">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => openEdit(task)}>
            <PencilIcon /> Tahrirlash
          </DropdownMenuItem>
          {!done && !cancelled && (
            <>
              <DropdownMenuItem onSelect={() => timerService.start({ taskId: task.id, projectId: task.projectId, learningItemId: task.learningItemId, lifeAreaId: task.lifeAreaId })}>
                <PlayIcon /> Taymerni boshlash
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => taskService.setStatus(task.id, task.status === 'in_progress' ? 'todo' : 'in_progress')}
              >
                <ArrowRightIcon /> {task.status === 'in_progress' ? '“Qilinadi”ga qaytarish' : 'Jarayonda deb belgilash'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.scheduledDate !== today && (
                <DropdownMenuItem onSelect={() => taskService.scheduleOn(task.id, today)}>
                  <CalendarIcon /> Bugunga belgilash
                </DropdownMenuItem>
              )}
              {task.weekStart !== thisWeek && (
                <DropdownMenuItem onSelect={() => taskService.planForWeek(task.id, thisWeek)}>
                  <CalendarIcon /> Shu hafta rejasiga
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => taskService.planForWeek(task.id, addDaysKey(task.weekStart ?? thisWeek, 7))}>
                <ArrowRightIcon /> Keyingi haftaga ko‘chirish
              </DropdownMenuItem>
              {task.weekStart && (
                <DropdownMenuItem onSelect={() => taskService.planForWeek(task.id, undefined)}>
                  <CalendarXIcon /> Rejadan chiqarish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => taskService.setStatus(task.id, 'cancelled')}>
                <XCircleIcon /> Bekor qilish
              </DropdownMenuItem>
            </>
          )}
          {cancelled && (
            <DropdownMenuItem onSelect={() => taskService.setStatus(task.id, 'todo')}>
              <ArrowRightIcon /> Qayta ochish
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onSelect={remove}>
            <Trash2Icon /> O‘chirish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
