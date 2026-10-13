import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FolderIcon,
  InfoIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CHART_COLORS, TrendLine } from '@/components/charts/Charts'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SectionCard } from '@/components/shared/SectionCard'
import { STATUS_TONES, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GOAL_METRIC_LABELS, GOAL_STATUS_LABELS, PROJECT_STATUS_LABELS } from '@/constants/labels'
import { TaskItem } from '@/features/tasks/components/TaskItem'
import { useTaskEditor } from '@/features/tasks/editor'
import { useCollection } from '@/hooks/useData'
import { formatDate, formatDateShort, isoToDateKey } from '@/services/date'
import { sortByPriority } from '@/services/analytics'
import { formatCompactNumber, formatNumber } from '@/services/money'
import type { GoalStatus } from '@/types'
import { useGoalEditor } from '../editor'
import { goalValueText, useGoalSummaries } from '../hooks'
import { goalService } from '../service'
import { MilestoneList } from './MilestoneList'

export function GoalDetailPage() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  const summaries = useGoalSummaries()
  const summary = summaries.find((s) => s.goal.id === goalId)
  const tasks = useCollection('tasks')
  const projects = useCollection('projects')
  const progress = useCollection('goalProgress')
  const openEdit = useGoalEditor((s) => s.openEdit)
  const openTask = useTaskEditor((s) => s.openCreate)
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [valueError, setValueError] = useState<string | null>(null)

  const linkedTasks = useMemo(() => sortByPriority(tasks.filter((t) => t.goalId === goalId)), [tasks, goalId])
  const linkedProjects = useMemo(() => projects.filter((p) => p.goalId === goalId), [projects, goalId])
  const history = useMemo(
    () =>
      progress
        .filter((p) => p.goalId === goalId)
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)),
    [progress, goalId],
  )
  const children = summaries.filter((s) => s.goal.parentGoalId === goalId)
  const parent = summary?.goal.parentGoalId ? summaries.find((s) => s.goal.id === summary.goal.parentGoalId) : undefined

  if (!summary) {
    return (
      <EmptyState
        title="Maqsad topilmadi"
        description="U o‘chirilgan yoki havola noto‘g‘ri bo‘lishi mumkin."
        action={
          <Button asChild variant="outline">
            <Link to="/goals">Maqsadlarga qaytish</Link>
          </Button>
        }
      />
    )
  }

  const { goal } = summary
  const canLog = goal.metricType === 'numeric' || goal.metricType === 'percent'
  const valueText = goalValueText(summary)

  const submitProgress = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(value.replace(/\s/g, '').replace(',', '.'))
    if (value.trim() === '' || !Number.isFinite(n)) {
      setValueError('Son kiriting')
      return
    }
    setValueError(null)
    if (goalService.logProgress(goal.id, n, note.trim())) {
      setValue('')
      setNote('')
    }
  }

  const remove = async () => {
    const ok = await confirmDelete(
      'Maqsad',
      'Maqsad, uning bosqichlari va progress tarixi o‘chiriladi. Bog‘langan vazifa va loyihalar saqlanib qoladi, lekin maqsaddan ajratiladi.',
    )
    if (ok && goalService.remove(goal.id)) navigate('/goals')
  }

  const setStatus = (s: GoalStatus) => goalService.setStatus(goal.id, s)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/goals">
            <ArrowLeftIcon /> Maqsadlar
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">{goal.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusBadge tone={STATUS_TONES[goal.status]}>{GOAL_STATUS_LABELS[goal.status]}</StatusBadge>
              <LifeAreaBadge areaId={goal.lifeAreaId} />
              <span className="text-xs text-muted-foreground">{GOAL_METRIC_LABELS[goal.metricType]}</span>
              {(goal.startDate || goal.targetDate) && (
                <span className="text-xs text-muted-foreground">
                  {goal.startDate ? formatDate(goal.startDate, 'd MMM yyyy') : '…'} → {goal.targetDate ? formatDate(goal.targetDate, 'd MMM yyyy') : '…'}
                </span>
              )}
            </div>
            {parent && (
              <p className="mt-2 text-sm text-muted-foreground">
                Ota maqsad:{' '}
                <Link to={`/goals/${parent.goal.id}`} className="text-foreground hover:underline">
                  {parent.goal.title}
                </Link>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {goal.status !== 'completed' && (
              <Button variant="outline" onClick={() => setStatus('completed')}>
                <CheckCircle2Icon /> Yakunlash
              </Button>
            )}
            <Button variant="outline" onClick={() => openEdit(goal)}>
              <PencilIcon /> Tahrirlash
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Boshqa amallar">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(['active', 'planned', 'paused', 'cancelled'] as const)
                  .filter((s) => s !== goal.status)
                  .map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => setStatus(s)}>
                      “{GOAL_STATUS_LABELS[s]}” holatiga o‘tkazish
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={remove}>
                  <Trash2Icon /> O‘chirish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {summary.overdue && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm" role="status">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p>
            Rejadagi muddat ({formatDate(goal.targetDate!, 'd MMMM')}) o‘tdi. Muddatni yangilash, maqsadni kichraytirish yoki vaqtincha to‘xtatish
            mumkin — barchasi oddiy reja tuzatishlari.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard title="Progress">
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-4">
                <span className="tabular text-4xl font-semibold">{summary.progress}%</span>
                {valueText && <span className="tabular text-sm text-muted-foreground">{valueText}</span>}
              </div>
              <ProgressBar value={summary.progress} showValue={false} label="Maqsad progressi" tone={goal.status === 'completed' ? 'success' : 'default'} />
              {goal.description && <p className="text-sm whitespace-pre-line text-muted-foreground">{goal.description}</p>}
              {canLog && goal.status !== 'completed' && goal.status !== 'cancelled' && (
                <form onSubmit={submitProgress} className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end" noValidate>
                  <div className="flex flex-col gap-1.5 sm:w-40">
                    <Label htmlFor="progress-value">{goal.metricType === 'percent' ? 'Yangi foiz' : `Yangi qiymat${goal.unit ? ` (${goal.unit})` : ''}`}</Label>
                    <Input
                      id="progress-value"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={String(goal.currentValue)}
                      aria-invalid={valueError ? true : undefined}
                      aria-describedby={valueError ? 'progress-error' : undefined}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor="progress-note">Izoh (ixtiyoriy)</Label>
                    <Input id="progress-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nima o‘zgardi?" />
                  </div>
                  <Button type="submit">Progress qayd etish</Button>
                </form>
              )}
              {valueError && (
                <p id="progress-error" className="text-xs text-destructive">
                  {valueError}
                </p>
              )}
              {history.length >= 2 && (
                <TrendLine
                  caption="Progress tarixi"
                  data={history.map((h) => ({ sana: formatDateShort(h.date), qiymat: h.value }))}
                  xKey="sana"
                  series={[{ key: 'qiymat', label: goal.unit ? `Qiymat (${goal.unit})` : 'Qiymat', color: CHART_COLORS.primary }]}
                  formatter={formatCompactNumber}
                  height={180}
                />
              )}
              {history.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Progress tarixi ({history.length})</summary>
                  <ul className="mt-2 divide-y rounded-lg border">
                    {[...history].reverse().map((h) => (
                      <li key={h.id} className="flex items-center gap-3 px-3 py-2">
                        <span className="tabular w-24 text-xs text-muted-foreground">{formatDate(h.date, 'd MMM yyyy')}</span>
                        <span className="tabular font-medium">{formatNumber(h.value)}</span>
                        <span className="flex-1 truncate text-xs text-muted-foreground">{h.note}</span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Progress yozuvini o‘chirish"
                          onClick={async () => {
                            if (await confirmDelete('Progress yozuvi')) goalService.removeProgress(h.id)
                          }}
                        >
                          <Trash2Icon />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Vazifalar"
            description={linkedTasks.length > 0 ? `${summary.tasks.done} / ${summary.tasks.total} bajarilgan` : undefined}
            action={
              <Button size="sm" variant="outline" onClick={() => openTask({ goalId: goal.id, lifeAreaId: goal.lifeAreaId })}>
                <PlusIcon /> Vazifa
              </Button>
            }
          >
            {linkedTasks.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {linkedTasks.map((t) => (
                  <li key={t.id}>
                    <TaskItem task={t} hideLinks />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Bu maqsadni keyingi aniq qadamlarga ajrating — vazifalar haftalik rejaga tushadi.</p>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Bosqichlar" description={summary.milestones.total > 0 ? `${summary.milestones.done} / ${summary.milestones.total} bajarilgan` : undefined}>
            <MilestoneList goalId={goal.id} />
          </SectionCard>

          <SectionCard title="Loyihalar">
            {linkedProjects.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {linkedProjects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link to={`/business/projects/${p.id}`} className="inline-flex min-w-0 items-center gap-2 hover:underline">
                      <FolderIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{p.title}</span>
                    </Link>
                    <StatusBadge tone={STATUS_TONES[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</StatusBadge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Bog‘langan loyiha yo‘q. Loyiha formasida shu maqsadni tanlash mumkin.</p>
            )}
          </SectionCard>

          {children.length > 0 && (
            <SectionCard title="Kichik maqsadlar">
              <ul className="flex flex-col gap-3">
                {children.map((c) => (
                  <li key={c.goal.id}>
                    <Link to={`/goals/${c.goal.id}`} className="text-sm hover:underline">
                      {c.goal.title}
                    </Link>
                    <ProgressBar value={c.progress} size="sm" label={`${c.goal.title} progressi`} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
          <p className="text-xs text-muted-foreground">Yaratilgan: {formatDate(isoToDateKey(goal.createdAt))}</p>
        </div>
      </div>
    </div>
  )
}
