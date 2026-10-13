import { PencilIcon, PlayIcon, PlusIcon, SquareIcon, TimerIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bars, CHART_COLORS } from '@/components/charts/Charts'
import { LifeAreaSelect, ProjectSelect, TaskSelect } from '@/components/forms/selects'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WeekNavigator, useSelectedWeek } from '@/features/weekly-planning/components/WeekNavigator'
import { useCollection, useDbState, useNow } from '@/hooks/useData'
import { entriesBetween, entryLifeAreaId, minutesByArea, plannedMinutes, tasksOfWeek, totalMinutes } from '@/services/analytics'
import { endOfWeekKey, formatDate, formatDuration, formatMinutes } from '@/services/date'
import { useTimeEntryEditor } from '../editor'
import { timeEntryService, timerService } from '../service'

function TimerCard() {
  const timer = useCollection('timer')
  const tasks = useCollection('tasks')
  const now = useNow(1000, timer !== null)
  const [taskId, setTaskId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [lifeAreaId, setLifeAreaId] = useState('')
  const [note, setNote] = useState('')

  if (timer) {
    const task = timer.taskId ? tasks.find((t) => t.id === timer.taskId) : undefined
    return (
      <SectionCard title={<span className="inline-flex items-center gap-2"><TimerIcon className="size-4 text-primary" aria-hidden="true" /> Taymer ishlayapti</span>}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="tabular text-4xl font-semibold" aria-live="off">{formatDuration(now - new Date(timer.startedAt).getTime())}</p>
            <p className="mt-1 text-sm text-muted-foreground">{task?.title ?? timer.note ?? 'Umumiy ish'}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => timerService.stop()}>
              <SquareIcon className="fill-current" /> To‘xtatish va saqlash
            </Button>
            <Button variant="outline" onClick={() => timerService.cancel()}>
              <XIcon /> Bekor qilish
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Brauzer yopilsa ham vaqt to‘g‘ri hisoblanadi — boshlanish vaqti saqlangan.</p>
      </SectionCard>
    )
  }

  const start = () => {
    const task = taskId ? tasks.find((t) => t.id === taskId) : undefined
    const ok = timerService.start({
      taskId: taskId || undefined,
      projectId: projectId || task?.projectId || undefined,
      lifeAreaId: lifeAreaId || task?.lifeAreaId || undefined,
      note: note.trim() || undefined,
    })
    if (ok) setNote('')
  }

  return (
    <SectionCard title="Taymer" description="Bir vaqtda faqat bitta taymer ishlaydi">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timer-task">Vazifa</Label>
          <TaskSelect id="timer-task" value={taskId} onChange={(e) => setTaskId(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timer-project">Loyiha</Label>
          <ProjectSelect id="timer-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timer-area">Soha</Label>
          <LifeAreaSelect id="timer-area" value={lifeAreaId} onChange={(e) => setLifeAreaId(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timer-note">Izoh</Label>
          <Input id="timer-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nima ustida?" />
        </div>
      </div>
      <Button className="mt-4" onClick={start}>
        <PlayIcon /> Boshlash
      </Button>
    </SectionCard>
  )
}

export function TimeTrackingPage() {
  const [week, setWeek] = useSelectedWeek()
  const state = useDbState()
  const openCreate = useTimeEntryEditor((s) => s.openCreate)
  const openEdit = useTimeEntryEditor((s) => s.openEdit)

  const data = useMemo(() => {
    const entries = entriesBetween(state.timeEntries, week, endOfWeekKey(week)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    const byDay = new Map<string, typeof entries>()
    for (const e of entries) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e])
    return {
      entries,
      byDay: [...byDay.entries()],
      total: totalMinutes(entries),
      planned: plannedMinutes(tasksOfWeek(state.tasks, week)),
      byArea: minutesByArea(entries, state),
    }
  }, [state, week])

  const label = (e: (typeof data.entries)[number]) => {
    const task = e.taskId ? state.tasks.find((t) => t.id === e.taskId) : undefined
    const project = e.projectId ? state.projects.find((p) => p.id === e.projectId) : undefined
    const areaId = entryLifeAreaId(e, state)
    const area = areaId ? state.lifeAreas.find((a) => a.id === areaId) : undefined
    return { title: task?.title ?? e.note ?? project?.title ?? 'Umumiy ish', meta: [project?.title, area?.name].filter(Boolean).join(' · ') }
  }

  return (
    <div className="flex flex-col gap-6">
      <TimerCard />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WeekNavigator week={week} onChange={setWeek} />
        <Button variant="outline" onClick={() => openCreate()}>
          <PlusIcon /> Qo‘lda kiritish
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Qayd etilgan" value={formatMinutes(data.total)} hint={`${data.entries.length} ta yozuv`} />
        <StatCard label="Rejalashtirilgan" value={formatMinutes(data.planned)} hint="Haftalik vazifalar bahosi" />
        <StatCard
          className="col-span-2 lg:col-span-1"
          label="Farq"
          value={data.planned > 0 ? `${Math.round((data.total / data.planned) * 100)}%` : '—'}
          hint={data.planned > 0 ? 'Amaldagi vaqt / reja' : 'Vazifalarga taxminiy vaqt qo‘shilmagan'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Yozuvlar" className="lg:col-span-2">
          {data.entries.length === 0 ? (
            <EmptyState
              compact
              icon={TimerIcon}
              title="Bu hafta vaqt qayd etilmagan"
              description="Taymerni ishga tushiring yoki sarflangan vaqtni qo‘lda kiriting."
              action={
                <Button size="sm" variant="outline" onClick={() => openCreate()}>
                  Qo‘lda kiritish
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {data.byDay.map(([day, list]) => (
                <div key={day}>
                  <h3 className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                    <span className="first-letter:uppercase">{formatDate(day, 'EEEE, d MMMM')}</span>
                    <span className="tabular">{formatMinutes(totalMinutes(list))}</span>
                  </h3>
                  <ul className="divide-y rounded-lg border">
                    {list.map((e) => {
                      const l = label(e)
                      return (
                        <li key={e.id} className="flex items-center gap-3 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{l.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {e.source === 'timer' ? 'Taymer' : 'Qo‘lda'}
                              {l.meta && ` · ${l.meta}`}
                            </p>
                          </div>
                          <span className="tabular text-sm font-medium">{formatMinutes(e.durationMinutes)}</span>
                          <Button variant="ghost" size="icon-xs" aria-label="Yozuvni tahrirlash" onClick={() => openEdit(e)}>
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Yozuvni o‘chirish"
                            onClick={async () => {
                              if (await confirmDelete('Vaqt yozuvi')) timeEntryService.remove(e.id)
                            }}
                          >
                            <Trash2Icon />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <SectionCard title="Sohalar bo‘yicha">
          {data.byArea.length > 0 ? (
            <Bars
              caption="Hayot sohalari bo‘yicha vaqt"
              data={data.byArea.map((a) => ({ soha: a.name, daqiqa: a.minutes }))}
              xKey="soha"
              series={[{ key: 'daqiqa', label: 'Vaqt', color: CHART_COLORS.primary }]}
              layout="vertical"
              formatter={(v) => formatMinutes(v)}
              height={Math.max(120, data.byArea.length * 36)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Ma’lumot yo‘q.</p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

