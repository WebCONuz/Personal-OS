import { ActivityIcon, CalendarHeartIcon, HeartIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { CHART_COLORS, TrendLine } from '@/components/charts/Charts'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FAMILY_EVENT_KIND_LABELS } from '@/constants/labels'
import { TaskItem } from '@/features/tasks/components/TaskItem'
import { useTaskEditor } from '@/features/tasks/editor'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { addDaysKey, formatDate, formatDateShort, relativeDayLabel } from '@/services/date'
import { isOpen, sortByPriority } from '@/services/analytics'
import { formatNumber } from '@/services/money'
import { useFamilyEditor, useHealthEditor } from '../editor'
import { daysUntil, familyService, healthService, nextOccurrence } from '../service'

const fmt = { format: (v: number) => formatNumber(v, 1) }

export function HealthPage() {
  const logs = useCollection('healthLogs')
  const today = useToday()
  const openCreate = useHealthEditor((s) => s.openCreate)
  const openEdit = useHealthEditor((s) => s.openEdit)

  const metrics = useMemo(() => {
    const map = new Map<string, typeof logs>()
    for (const l of [...logs].sort((a, b) => a.date.localeCompare(b.date))) map.set(l.metric, [...(map.get(l.metric) ?? []), l])
    const weekAgo = addDaysKey(today, -6)
    return [...map.entries()].map(([metric, list]) => {
      const recent = list.filter((l) => l.date >= weekAgo)
      return {
        metric,
        list,
        latest: list.at(-1)!,
        avg7: recent.length ? recent.reduce((s, l) => s + l.value, 0) / recent.length : null,
      }
    })
  }, [logs, today])

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="Salomatlik ko‘rsatkichlari yo‘q"
        description="O‘zingiz tanlagan oddiy ko‘rsatkichlarni kuzating: uyqu, qadamlar, mashq. Bu shaxsiy jurnal — tibbiy tavsiya bermaydi."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Qayd qo‘shish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Shaxsiy kuzatuv uchun. Tibbiy diagnostika yoki tavsiya berilmaydi.</p>
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Qayd
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {metrics.map((m) => (
          <SectionCard
            key={m.metric}
            title={m.metric}
            description={`Oxirgi: ${fmt.format(m.latest.value)} ${m.latest.unit ?? ''} · ${relativeDayLabel(m.latest.date, today)}`}
            action={
              <Button size="sm" variant="outline" onClick={() => openCreate({ metric: m.metric, unit: m.latest.unit })}>
                <PlusIcon /> Qayd
              </Button>
            }
          >
            {m.avg7 !== null && (
              <p className="tabular mb-2 text-sm">
                7 kunlik o‘rtacha: <span className="font-medium">{fmt.format(m.avg7)} {m.latest.unit ?? ''}</span>
              </p>
            )}
            {m.list.length >= 2 && (
              <TrendLine
                caption={`${m.metric} dinamikasi`}
                data={m.list.slice(-14).map((l) => ({ sana: formatDateShort(l.date), qiymat: l.value }))}
                xKey="sana"
                series={[{ key: 'qiymat', label: m.metric, color: CHART_COLORS.primary }]}
                formatter={(v) => fmt.format(v)}
                height={150}
              />
            )}
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Yozuvlar ({m.list.length})</summary>
              <ul className="mt-2 divide-y rounded-lg border">
                {[...m.list].reverse().map((l) => (
                  <li key={l.id} className="flex items-center gap-3 px-3 py-1.5">
                    <span className="w-16 text-xs text-muted-foreground">{formatDate(l.date, 'd MMM')}</span>
                    <span className="tabular flex-1">
                      {fmt.format(l.value)} {l.unit}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{l.note}</span>
                    <Button variant="ghost" size="icon-xs" aria-label="Tahrirlash" onClick={() => openEdit(l)}>
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="O‘chirish"
                      onClick={async () => {
                        if (await confirmDelete('Yozuv')) healthService.remove(l.id)
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </li>
                ))}
              </ul>
            </details>
          </SectionCard>
        ))}
      </div>
    </div>
  )
}

export function FamilyPage() {
  const events = useCollection('familyEvents')
  const tasks = useCollection('tasks')
  const today = useToday()
  const openCreate = useFamilyEditor((s) => s.openCreate)
  const openEdit = useFamilyEditor((s) => s.openEdit)
  const openTask = useTaskEditor((s) => s.openCreate)

  const dates = useMemo(
    () =>
      events
        .filter((e) => e.kind === 'important_date')
        .map((e) => ({ event: e, next: nextOccurrence(e, today) }))
        .filter((x) => x.next >= today)
        .sort((a, b) => a.next.localeCompare(b.next)),
    [events, today],
  )
  const plans = events.filter((e) => e.kind === 'plan').sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date))
  const notes = events.filter((e) => e.kind === 'note').sort((a, b) => b.date.localeCompare(a.date))
  const familyTasks = sortByPriority(tasks.filter((t) => t.lifeAreaId === 'area-family' && isOpen(t)))

  const actions = (id: string, title: string) => {
    const event = events.find((e) => e.id === id)!
    return (
      <div className="flex shrink-0">
        <Button variant="ghost" size="icon-xs" aria-label={`“${title}”ni tahrirlash`} onClick={() => openEdit(event)}>
          <PencilIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`“${title}”ni o‘chirish`}
          onClick={async () => {
            if (await confirmDelete('Yozuv')) familyService.remove(id)
          }}
        >
          <Trash2Icon />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Oila uchun vaqt o‘lchanadigan KPI emas — bu yerda faqat unutmaslik kerak bo‘lgan narsalar.</p>
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Yozuv
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title={<span className="inline-flex items-center gap-2"><CalendarHeartIcon className="size-4" aria-hidden="true" /> Yaqinlashayotgan muhim sanalar</span>}>
          {dates.length ? (
            <ul className="flex flex-col gap-2">
              {dates.map(({ event, next }) => {
                const d = daysUntil(next, today)
                return (
                  <li key={event.id} className="flex items-start gap-3">
                    <div className={cn('w-14 shrink-0 rounded-md border px-1.5 py-1 text-center', d <= 7 && 'border-primary/50 bg-accent/50')}>
                      <p className="text-xs text-muted-foreground">{formatDate(next, 'MMM')}</p>
                      <p className="tabular text-sm font-semibold">{formatDate(next, 'd')}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {relativeDayLabel(next, today)}
                        {event.repeatsYearly && ' · har yili'}
                        {event.note && ` · ${event.note}`}
                      </p>
                    </div>
                    {actions(event.id, event.title)}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Tug‘ilgan kunlar va yubileylarni “har yili takrorlanadi” belgisi bilan qo‘shing.</p>
          )}
        </SectionCard>

        <SectionCard title="Rejalar" action={<Button size="sm" variant="outline" onClick={() => openCreate({ kind: 'plan' })}><PlusIcon /> Reja</Button>}>
          {plans.length ? (
            <ul className="flex flex-col gap-2">
              {plans.map((p) => (
                <li key={p.id} className="flex items-start gap-3">
                  <Checkbox checked={p.done} onCheckedChange={(c) => familyService.update(p.id, { done: c === true }, c ? 'Belgilandi' : 'Qayta ochildi')} aria-label={`“${p.title}” bajarildi`} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', p.done && 'text-muted-foreground line-through')}>{p.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.date, 'd MMMM')}</p>
                  </div>
                  {actions(p.id, p.title)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sayohat, mehmonga borish yoki birga vaqt o‘tkazish rejalarini yozing.</p>
          )}
        </SectionCard>

        <SectionCard
          title={<span className="inline-flex items-center gap-2"><HeartIcon className="size-4" aria-hidden="true" /> Oila vazifalari</span>}
          action={<Button size="sm" variant="outline" onClick={() => openTask({ lifeAreaId: 'area-family' })}><PlusIcon /> Vazifa</Button>}
        >
          {familyTasks.length ? (
            <ul className="flex flex-col gap-2">
              {familyTasks.map((t) => (
                <li key={t.id}>
                  <TaskItem task={t} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">“Oila” sohasidagi ochiq vazifalar shu yerda ko‘rinadi.</p>
          )}
        </SectionCard>
      </div>

      {notes.length > 0 && (
        <SectionCard title="Qaydlar">
          <div className="grid gap-2 md:grid-cols-2">
            {notes.map((n) => (
              <Card key={n.id} className="flex-row items-start gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.note && <p className="text-sm text-muted-foreground">{n.note}</p>}
                  <StatusBadge tone="muted" className="mt-1">{FAMILY_EVENT_KIND_LABELS[n.kind]} · {formatDate(n.date, 'd MMM yyyy')}</StatusBadge>
                </div>
                {actions(n.id, n.title)}
              </Card>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
