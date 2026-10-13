import { CalendarIcon, FlagIcon, ListChecksIcon } from 'lucide-react'
import { Link } from 'react-router'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { STATUS_TONES, StatusBadge } from '@/components/shared/StatusBadge'
import { Card } from '@/components/ui/card'
import { GOAL_STATUS_LABELS } from '@/constants/labels'
import { cn } from '@/lib/utils'
import { formatDate } from '@/services/date'
import { goalValueText, type GoalSummary } from '../hooks'

export function GoalCard({ summary, compact }: { summary: GoalSummary; compact?: boolean }) {
  const { goal } = summary
  const value = goalValueText(summary)
  return (
    <Card className={cn('relative gap-3 px-4 py-4 transition-colors hover:border-primary/40', compact && 'gap-2 py-3')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/goals/${goal.id}`}
            className="line-clamp-2 font-medium after:absolute after:inset-0 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {goal.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <LifeAreaBadge areaId={goal.lifeAreaId} />
            {goal.targetDate && (
              <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', summary.overdue && 'text-warning-foreground')}>
                <CalendarIcon className="size-3.5" aria-hidden="true" />
                {summary.overdue ? 'Muddat o‘tgan: ' : ''}
                {formatDate(goal.targetDate, 'd MMM yyyy')}
              </span>
            )}
          </div>
        </div>
        <StatusBadge tone={STATUS_TONES[goal.status]}>{GOAL_STATUS_LABELS[goal.status]}</StatusBadge>
      </div>
      {goal.metricType !== 'completion' || goal.status === 'completed' ? (
        <div>
          <ProgressBar value={summary.progress} label={`${goal.title} progressi`} tone={goal.status === 'completed' ? 'success' : 'default'} />
          {value && <p className="tabular mt-1 text-xs text-muted-foreground">{value}</p>}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Bir martalik natija — yakunlanganda belgilang</p>
      )}
      {!compact && (summary.next || summary.tasks.total > 0) && (
        <div className="flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
          {summary.next && (
            <span className="inline-flex items-center gap-1.5">
              <FlagIcon className="size-3.5" aria-hidden="true" />
              Keyingi bosqich: <span className="truncate text-foreground">{summary.next.title}</span>
            </span>
          )}
          {summary.tasks.total > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <ListChecksIcon className="size-3.5" aria-hidden="true" />
              Vazifalar: {summary.tasks.done} / {summary.tasks.total}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
