import { SquareIcon, TimerIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useCollection, useNow } from '@/hooks/useData'
import { formatDuration } from '@/services/date'
import { timerService } from '../service'

/** Compact running-timer badge for the top bar. Elapsed time is derived from `startedAt`. */
export function TimerIndicator() {
  const timer = useCollection('timer')
  const tasks = useCollection('tasks')
  const now = useNow(1000, timer !== null)
  if (!timer) return null
  const task = timer.taskId ? tasks.find((t) => t.id === timer.taskId) : undefined
  const elapsed = now - new Date(timer.startedAt).getTime()
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-accent/50 py-0.5 pr-0.5 pl-2">
      <Link to="/planning/time" className="flex items-center gap-1.5 text-xs font-medium" title={task?.title ?? 'Taymer'}>
        <TimerIcon className="size-3.5 text-primary" aria-hidden="true" />
        <span className="tabular" aria-label={`Taymer ishlayapti: ${formatDuration(elapsed)}`}>
          {formatDuration(elapsed)}
        </span>
        {task && <span className="hidden max-w-32 truncate text-muted-foreground md:inline">{task.title}</span>}
      </Link>
      <Button size="icon-xs" variant="ghost" onClick={() => timerService.stop()} aria-label="Taymerni to‘xtatish va saqlash">
        <SquareIcon className="fill-current" />
      </Button>
    </div>
  )
}
