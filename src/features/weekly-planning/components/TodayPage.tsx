import { CalendarCheckIcon, PlusIcon } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { HabitTodayList } from '@/features/habits/components/HabitTodayList'
import { reviewService } from '@/features/reviews/service'
import { TaskItem } from '@/features/tasks/components/TaskItem'
import { useTaskEditor } from '@/features/tasks/editor'
import { useCollection, useToday } from '@/hooks/useData'
import { entriesBetween, isOpen, plannedMinutes, sortByPriority, tasksForDay, totalMinutes } from '@/services/analytics'
import { formatDate, formatMinutes } from '@/services/date'

export function TodayPage() {
  const today = useToday()
  const tasks = useCollection('tasks')
  const habits = useCollection('habits')
  const timeEntries = useCollection('timeEntries')
  const reviews = useCollection('reviews')
  const openCreate = useTaskEditor((s) => s.openCreate)
  const dayTasks = useMemo(() => sortByPriority(tasksForDay(tasks, today)), [tasks, today])
  const open = dayTasks.filter(isOpen)
  const done = dayTasks.filter((t) => t.status === 'done')
  const top = open.slice(0, 3)
  const rest = open.slice(3)
  const tracked = totalMinutes(entriesBetween(timeEntries, today, today))
  const note = reviews.find((r) => r.periodType === 'daily' && r.periodStart === today)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground first-letter:uppercase">{formatDate(today, 'EEEE, d MMMM yyyy')}</p>
        <Button onClick={() => openCreate({ scheduledDate: today })}>
          <PlusIcon /> Bugunga vazifa
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Rejada" value={open.length} hint="ochiq vazifa" />
        <StatCard label="Bajarildi" value={done.length} hint="bugun" />
        <StatCard label="Rejalashtirilgan vaqt" value={formatMinutes(plannedMinutes(open))} />
        <StatCard label="Qayd etilgan vaqt" value={formatMinutes(tracked)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard title="Bugungi eng muhim 3 ta" description="Ustuvorlik va muddat bo‘yicha tanlangan">
            {top.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {top.map((t) => (
                  <li key={t.id}>
                    <TaskItem task={t} showSchedule={false} className="border-primary/30" />
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                compact
                icon={CalendarCheckIcon}
                title={done.length > 0 ? 'Bugungi reja bajarildi' : 'Bugunga vazifa belgilanmagan'}
                description={done.length > 0 ? 'Dam oling yoki kun yakunini yozing.' : 'Haftalik rejadan bir-ikkita vazifani bugunga belgilang.'}
                action={
                  done.length === 0 ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/planning">Haftalik rejani ochish</Link>
                    </Button>
                  ) : undefined
                }
              />
            )}
          </SectionCard>
          {rest.length > 0 && (
            <SectionCard title="Boshqa vazifalar">
              <ul className="flex flex-col gap-2">
                {rest.map((t) => (
                  <li key={t.id}>
                    <TaskItem task={t} showSchedule={false} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
          {done.length > 0 && (
            <SectionCard title="Bajarilgan ishlar" description={`${done.length} ta`}>
              <ul className="flex flex-col gap-2">
                {done.map((t) => (
                  <li key={t.id}>
                    <TaskItem task={t} showSchedule={false} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <SectionCard title="Bugungi odatlar">
            {habits.some((h) => h.active) ? (
              <HabitTodayList />
            ) : (
              <p className="text-sm text-muted-foreground">
                Faol odat yo‘q. <Link to="/lifestyle" className="text-primary hover:underline">Odat qo‘shish</Link>
              </p>
            )}
          </SectionCard>
          <SectionCard title="Kun yakuni" description="Qisqa qayd — 2 daqiqa">
            <DayNoteForm key={`${today}:${note?.updatedAt ?? ''}`} day={today} initialWins={note?.wins ?? ''} initialLessons={note?.lessons ?? ''} />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

/** Remounted (via key) when the stored note changes, so local edits never fight with stored data. */
function DayNoteForm({ day, initialWins, initialLessons }: { day: string; initialWins: string; initialLessons: string }) {
  const [wins, setWins] = useState(initialWins)
  const [lessons, setLessons] = useState(initialLessons)
  const save = (e: FormEvent) => {
    e.preventDefault()
    reviewService.saveDaily(day, { wins: wins.trim(), lessons: lessons.trim() })
  }
  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="day-wins">Bugun nima yaxshi bo‘ldi?</Label>
        <Textarea id="day-wins" rows={3} value={wins} onChange={(e) => setWins(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="day-lessons">Ertaga uchun xulosa</Label>
        <Textarea id="day-lessons" rows={2} value={lessons} onChange={(e) => setLessons(e.target.value)} />
      </div>
      <Button type="submit" variant="outline" disabled={!wins.trim() && !lessons.trim()}>
        Saqlash
      </Button>
    </form>
  )
}
