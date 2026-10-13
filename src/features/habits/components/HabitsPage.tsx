import { ArchiveIcon, ArchiveRestoreIcon, FlameIcon, InfoIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, RepeatIcon, Trash2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { HABIT_FREQUENCY_LABELS } from '@/constants/labels'
import { WeekNavigator, useSelectedWeek } from '@/features/weekly-planning/components/WeekNavigator'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { formatDateShort, formatWeekday, weekDays } from '@/services/date'
import { HABIT_STREAK_RULE_TEXT, habitStreak, habitWeekRate } from '@/services/gamification/streak'
import type { Habit } from '@/types'
import { useHabitEditor } from '../editor'
import { habitService } from '../service'

export function HabitsPage() {
  const habits = useCollection('habits')
  const logs = useCollection('habitLogs')
  const today = useToday()
  const [week, setWeek] = useSelectedWeek()
  const openCreate = useHabitEditor((s) => s.openCreate)
  const openEdit = useHabitEditor((s) => s.openEdit)
  const days = useMemo(() => weekDays(week), [week])
  const active = habits.filter((h) => h.active)
  const archived = habits.filter((h) => !h.active)

  const isDone = (habitId: string, day: string) => logs.some((l) => l.habitId === habitId && l.date === day && l.completed)

  const remove = async (h: Habit) => {
    if (await confirmDelete(`“${h.title}” odati`, 'Odat va uning barcha loglari o‘chiriladi. Tarixni saqlash uchun arxivlash yaxshiroq.')) habitService.remove(h.id)
  }

  if (habits.length === 0) {
    return (
      <EmptyState
        icon={RepeatIcon}
        title="Odatlar hali yo‘q"
        description="Kichik va aniq odatdan boshlang: “har kuni 20 daqiqa ingliz tili” yoki “haftada 3 marta mashq”."
        action={
          <Button onClick={() => openCreate()}>
            <PlusIcon /> Odat qo‘shish
          </Button>
        }
      />
    )
  }

  const menu = (h: Habit) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`“${h.title}” amallari`}>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => openEdit(h)}>
          <PencilIcon /> Tahrirlash
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => habitService.setActive(h.id, !h.active)}>
          {h.active ? <ArchiveIcon /> : <ArchiveRestoreIcon />} {h.active ? 'Arxivlash' : 'Faollashtirish'}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => remove(h)}>
          <Trash2Icon /> O‘chirish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WeekNavigator week={week} onChange={setWeek} />
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Odat
        </Button>
      </div>

      <div className="relative overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Haftalik odatlar jadvali</caption>
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-2 text-left font-medium">Odat</th>
              {days.map((d) => (
                <th key={d} scope="col" className={cn('px-1 py-2 text-center font-medium', d === today && 'text-primary')}>
                  <span className="block capitalize">{formatWeekday(d, 'EEEEEE')}</span>
                  <span className="block font-normal">{formatDateShort(d).split(' ')[0]}</span>
                </th>
              ))}
              <th scope="col" className="px-2 py-2 text-right font-medium">Hafta</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Streak</th>
              <th scope="col" className="w-10"><span className="sr-only">Amallar</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {active.map((h) => (
              <tr key={h.id}>
                <th scope="row" className="px-4 py-2.5 text-left font-normal">
                  <span className="block font-medium">{h.title}</span>
                  <span className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                    <span>{h.frequency === 'weekly' ? `Haftada ${h.targetPerWeek} marta` : HABIT_FREQUENCY_LABELS.daily}</span>
                    <LifeAreaBadge areaId={h.lifeAreaId} />
                  </span>
                </th>
                {days.map((d) => (
                  <td key={d} className={cn('px-1 py-2 text-center', d === today && 'bg-accent/40')}>
                    <Checkbox
                      checked={isDone(h.id, d)}
                      disabled={d > today}
                      onCheckedChange={(c) => habitService.setLog(h.id, d, c === true)}
                      aria-label={`${h.title}: ${formatWeekday(d)}, ${formatDateShort(d)}`}
                    />
                  </td>
                ))}
                <td className="tabular px-2 text-right text-xs">{habitWeekRate(h, logs, week)}%</td>
                <td className="px-2 text-right text-xs">
                  <span className="inline-flex items-center gap-0.5">
                    <FlameIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="tabular">{habitStreak(h, logs, today)}</span>
                  </span>
                </td>
                <td className="pr-2">{menu(h)}</td>
              </tr>
            ))}
            {active.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Faol odat yo‘q. Arxivdagini faollashtiring yoki yangisini qo‘shing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {HABIT_STREAK_RULE_TEXT} Kelajakdagi kunlarni belgilab bo‘lmaydi.
      </p>

      {archived.length > 0 && (
        <details className="rounded-xl border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Arxivlangan odatlar ({archived.length})</summary>
          <ul className="mt-3 divide-y">
            {archived.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="text-muted-foreground">{h.title}</span>
                {menu(h)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
