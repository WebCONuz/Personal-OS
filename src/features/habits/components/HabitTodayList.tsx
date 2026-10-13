import { FlameIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { startOfWeekKey } from '@/services/date'
import { completedInWeek, habitStreak } from '@/services/gamification/streak'
import { habitService } from '../service'

/** Quick check-off of active habits for today (used on Dashboard and the daily view). */
export function HabitTodayList() {
  const habits = useCollection('habits')
  const logs = useCollection('habitLogs')
  const today = useToday()
  const rows = useMemo(() => {
    const week = startOfWeekKey(today)
    return habits
      .filter((h) => h.active)
      .map((h) => ({
        habit: h,
        done: logs.some((l) => l.habitId === h.id && l.date === today && l.completed),
        streak: habitStreak(h, logs, today),
        weekDone: completedInWeek(h.id, logs, week),
      }))
  }, [habits, logs, today])

  if (rows.length === 0) return null
  return (
    <ul className="flex flex-col gap-1">
      {rows.map(({ habit, done, streak, weekDone }) => (
        <li key={habit.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
          <Checkbox
            checked={done}
            onCheckedChange={(c) => habitService.setLog(habit.id, today, c === true)}
            aria-label={`“${habit.title}” bugun bajarildi`}
          />
          <span className={cn('flex-1 text-sm', done && 'text-muted-foreground')}>{habit.title}</span>
          <span className="tabular text-xs text-muted-foreground">
            {habit.frequency === 'weekly' ? `${weekDone}/${habit.targetPerWeek} hafta` : ''}
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground" title="Streak">
              <FlameIcon className="size-3.5" aria-hidden="true" />
              <span className="tabular">{streak}</span>
              <span className="sr-only">{habit.frequency === 'daily' ? 'kunlik streak' : 'haftalik streak'}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
