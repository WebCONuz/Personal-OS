import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  CircleIcon,
  ClipboardCheckIcon,
  LightbulbIcon,
  ListTodoIcon,
  PlusIcon,
  RepeatIcon,
  TargetIcon,
  WalletIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Bars, CHART_COLORS } from '@/components/charts/Charts'
import { MoneyTotals } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { useTransactionEditor } from '@/features/finance/editor'
import { LevelCard } from '@/features/gamification/components/LevelCard'
import { GoalCard } from '@/features/goals/components/GoalCard'
import { useGoalEditor } from '@/features/goals/editor'
import { useGoalSummaries } from '@/features/goals/hooks'
import { HabitTodayList } from '@/features/habits/components/HabitTodayList'
import { useHabitEditor } from '@/features/habits/editor'
import { TaskItem } from '@/features/tasks/components/TaskItem'
import { useTaskEditor } from '@/features/tasks/editor'
import { useWeekOverview } from '@/features/weekly-planning/hooks'
import { useDbState, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import {
  computeInsights,
  entriesBetween,
  isOpen,
  minutesByArea,
  monthlyFinance,
  sortByPriority,
  tasksByArea,
  tasksForDay,
  totalMinutes,
} from '@/services/analytics'
import { addDaysKey, endOfWeekKey, formatDate, formatMinutes, formatMonth, formatWeekRange, greetingFor, monthKeyOf, parseDateKey, startOfWeekKey } from '@/services/date'

function GettingStarted() {
  const state = useDbState()
  const openGoal = useGoalEditor((s) => s.openCreate)
  const openTask = useTaskEditor((s) => s.openCreate)
  const openHabit = useHabitEditor((s) => s.openCreate)
  const openTx = useTransactionEditor((s) => s.openCreate)
  const week = startOfWeekKey(useToday())
  const steps = [
    { done: state.goals.length > 0, label: '3–5 ta muhim maqsad qo‘shing', action: () => openGoal(), cta: 'Maqsad' },
    { done: state.weeklyPlans.some((p) => p.weekStart === week && p.priorities.length > 0), label: 'Shu hafta uchun ustuvor natijalarni tanlang', to: '/planning', cta: 'Reja' },
    { done: state.tasks.length > 0, label: 'Natijalarni aniq vazifalarga ajrating', action: () => openTask({ weekStart: week }), cta: 'Vazifa' },
    { done: state.habits.length > 0, label: 'Bitta kichik odatdan boshlang', action: () => openHabit(), cta: 'Odat' },
    { done: state.transactions.length > 0, label: 'Birinchi daromad yoki xarajatni kiriting', action: () => openTx(), cta: 'Tranzaksiya' },
  ]
  const doneCount = steps.filter((s) => s.done).length
  if (doneCount === steps.length) return null
  return (
    <SectionCard title="Boshlash" description={`${doneCount} / ${steps.length} qadam bajarildi`}>
      <ol className="flex flex-col gap-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            {s.done ? <CheckCircle2Icon className="size-4 shrink-0 text-success" aria-label="Bajarildi" /> : <CircleIcon className="size-4 shrink-0 text-muted-foreground" aria-label="Bajarilmagan" />}
            <span className={cn('flex-1 text-sm', s.done && 'text-muted-foreground line-through')}>{s.label}</span>
            {!s.done &&
              (s.to ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={s.to}>{s.cta}</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={s.action}>
                  <PlusIcon /> {s.cta}
                </Button>
              ))}
          </li>
        ))}
      </ol>
    </SectionCard>
  )
}

export function DashboardPage() {
  const state = useDbState()
  const today = useToday()
  const week = startOfWeekKey(today)
  const overview = useWeekOverview(week)
  const goals = useGoalSummaries()
  const openTask = useTaskEditor((s) => s.openCreate)
  const name = state.profile.displayName

  const todayTasks = useMemo(() => sortByPriority(tasksForDay(state.tasks, today).filter(isOpen)), [state.tasks, today])
  const doneToday = useMemo(() => tasksForDay(state.tasks, today).filter((t) => t.status === 'done').length, [state.tasks, today])
  const activeGoals = goals.filter((g) => g.goal.status === 'active').sort((a, b) => (a.goal.targetDate ?? '9999').localeCompare(b.goal.targetDate ?? '9999'))
  const weekEntries = useMemo(() => entriesBetween(state.timeEntries, week, endOfWeekKey(week)), [state.timeEntries, week])
  const byArea = useMemo(() => minutesByArea(weekEntries, state), [weekEntries, state])
  const taskAreas = useMemo(() => tasksByArea(overview.tasks, state.lifeAreas), [overview.tasks, state.lifeAreas])
  const month = monthKeyOf(today)
  const finance = useMemo(() => monthlyFinance(state.transactions, month), [state.transactions, month])
  const insights = useMemo(() => computeInsights(state, today), [state, today])
  const hasReview = state.reviews.some((r) => r.periodType === 'weekly' && r.periodStart === week)
  const lastWeek = addDaysKey(week, -7)
  const lastWeekReviewed = state.reviews.some((r) => r.periodType === 'weekly' && r.periodStart === lastWeek)
  const challenge = overview.plan?.challenge
  const isWeekend = [0, 6].includes(parseDateKey(today).getDay())

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Greeting */}
      <div>
        <h1 className="text-2xl font-semibold">
          {greetingFor()}
          {name ? `, ${name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="capitalize">{formatDate(today, 'EEEE, d MMMM')}</span> · Hafta {formatWeekRange(week)}
        </p>
      </div>

      <GettingStarted />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 2. Today */}
        <SectionCard
          className="lg:col-span-7"
          title={<span className="inline-flex items-center gap-2"><CalendarCheckIcon className="size-4" aria-hidden="true" /> Bugungi reja</span>}
          description={todayTasks.length ? `${todayTasks.length} ta ochiq · ${doneToday} ta bajarilgan` : undefined}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/planning/today">
                Batafsil <ArrowRightIcon />
              </Link>
            </Button>
          }
        >
          {todayTasks.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {todayTasks.slice(0, 3).map((t) => (
                <li key={t.id}>
                  <TaskItem task={t} showSchedule={false} />
                </li>
              ))}
              {todayTasks.length > 3 && <li className="text-xs text-muted-foreground">Yana {todayTasks.length - 3} ta vazifa “Bugun” sahifasida</li>}
            </ol>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4">
              <p className="text-sm text-muted-foreground">
                {doneToday > 0 ? `Bugun ${doneToday} ta vazifa bajarildi. Ajoyib — qolgan vaqtni ongli o‘tkazing.` : 'Bugunga vazifa belgilanmagan. Haftalik rejadan 1–3 ta muhim ishni tanlang.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => openTask({ scheduledDate: today })}>
                  <PlusIcon /> Bugunga vazifa
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/planning">Haftalik reja</Link>
                </Button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* 3. Week */}
        <SectionCard
          className="lg:col-span-5"
          title="Bu hafta"
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/planning">
                Reja <ArrowRightIcon />
              </Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="tabular text-2xl font-semibold">{overview.completion.percent}%</span>
                <span className="tabular text-sm text-muted-foreground">
                  {overview.completion.done} / {overview.completion.total} vazifa
                </span>
              </div>
              <ProgressBar value={overview.completion.percent} showValue={false} label="Haftalik bajarilish" />
            </div>
            {overview.plan && overview.plan.priorities.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-sm">
                {overview.plan.priorities.map((p) => (
                  <li key={p.id} className="flex items-start gap-2">
                    {p.done ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-label="Erishildi" /> : <CircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Ochiq" />}
                    <span className={cn(p.done && 'text-muted-foreground')}>{p.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Haftaning ustuvor natijalari belgilanmagan.{' '}
                <Link to="/planning" className="text-primary hover:underline">
                  Belgilash
                </Link>
              </p>
            )}
            {overview.plan?.status === 'draft' && (
              <p className="text-xs text-muted-foreground">
                Reja hali qoralama.{' '}
                <Link to="/planning" className="text-primary hover:underline">
                  Rejani boshlash
                </Link>
              </p>
            )}
            <p className={cn('text-xs text-muted-foreground', overview.capacity.isOverplanned && 'text-warning-foreground')}>
              Rejalashtirilgan: {formatMinutes(overview.capacity.planned)} / {formatMinutes(overview.capacity.plannable)}
              {overview.capacity.isOverplanned && ' — reja mavjud vaqtdan katta'}
            </p>
          </div>
        </SectionCard>

        {/* 4. Goals */}
        <SectionCard
          className="lg:col-span-8"
          title={<span className="inline-flex items-center gap-2"><TargetIcon className="size-4" aria-hidden="true" /> Faol maqsadlar</span>}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/goals">
                Barchasi <ArrowRightIcon />
              </Link>
            </Button>
          }
        >
          {activeGoals.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeGoals.slice(0, 4).map((s) => (
                <GoalCard key={s.goal.id} summary={s} compact />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Faol maqsad yo‘q.{' '}
              <Link to="/goals" className="text-primary hover:underline">
                Maqsadlar sahifasi
              </Link>
            </p>
          )}
        </SectionCard>

        {state.profile.gamificationEnabled && (
          <div className="lg:col-span-4">
            <LevelCard />
          </div>
        )}

        {/* 5. Time distribution */}
        <SectionCard
          className={state.profile.gamificationEnabled ? 'lg:col-span-6' : 'lg:col-span-4'}
          title="Vaqt taqsimoti"
          description={weekEntries.length ? `Shu hafta ${formatMinutes(totalMinutes(weekEntries))} qayd etildi` : 'Shu haftadagi vazifalar sohalar bo‘yicha'}
        >
          {byArea.length > 0 ? (
            <Bars
              caption="Shu hafta sohalar bo‘yicha vaqt"
              data={byArea.map((a) => ({ soha: a.name, daqiqa: a.minutes }))}
              xKey="soha"
              series={[{ key: 'daqiqa', label: 'Vaqt', color: CHART_COLORS.primary }]}
              layout="vertical"
              formatter={(v) => formatMinutes(v)}
              height={Math.max(120, byArea.length * 34)}
            />
          ) : taskAreas.length > 0 ? (
            <Bars
              caption="Shu hafta sohalar bo‘yicha vazifalar soni"
              data={taskAreas.map((a) => ({ soha: a.name, vazifa: a.total }))}
              xKey="soha"
              series={[{ key: 'vazifa', label: 'Vazifalar', color: CHART_COLORS.primary }]}
              layout="vertical"
              height={Math.max(120, taskAreas.length * 34)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ma’lumot yo‘q. <Link to="/planning/time" className="text-primary hover:underline">Vaqtni qayd etish</Link>
            </p>
          )}
        </SectionCard>

        {/* 6. Finance */}
        <SectionCard
          className={state.profile.gamificationEnabled ? 'lg:col-span-6' : 'lg:col-span-4'}
          title={<span className="inline-flex items-center gap-2"><WalletIcon className="size-4" aria-hidden="true" /> Moliya · <span className="capitalize">{formatMonth(month)}</span></span>}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/finance">
                Batafsil <ArrowRightIcon />
              </Link>
            </Button>
          }
        >
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Daromad</dt>
              <dd className="font-medium"><MoneyTotals totals={finance.income} /></dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Xarajat</dt>
              <dd className="font-medium"><MoneyTotals totals={finance.expense} /></dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Farq</dt>
              <dd className="font-medium"><MoneyTotals totals={finance.net} signed /></dd>
            </div>
          </dl>
        </SectionCard>

        {/* 7. Habits & challenge */}
        <SectionCard
          className={state.profile.gamificationEnabled ? 'lg:col-span-6' : 'lg:col-span-4'}
          title={<span className="inline-flex items-center gap-2"><RepeatIcon className="size-4" aria-hidden="true" /> Odatlar</span>}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/lifestyle">
                Barchasi <ArrowRightIcon />
              </Link>
            </Button>
          }
        >
          {state.habits.some((h) => h.active) ? <HabitTodayList /> : <p className="text-sm text-muted-foreground">Faol odat yo‘q.</p>}
          {challenge && (
            <p className="mt-3 border-t pt-3 text-sm">
              <span className="text-muted-foreground">Haftalik challenge:</span> {challenge.title} {challenge.done ? '✓' : ''}
            </p>
          )}
        </SectionCard>

        {/* Insights */}
        {insights.length > 0 && (
          <SectionCard
            className="lg:col-span-6"
            title={<span className="inline-flex items-center gap-2"><LightbulbIcon className="size-4" aria-hidden="true" /> E’tibor berish kerak</span>}
            description="Ma’lumotlaringizdan hisoblangan kuzatuvlar"
            action={
              <Button asChild size="sm" variant="ghost">
                <Link to="/analytics">
                  Statistika <ArrowRightIcon />
                </Link>
              </Button>
            }
          >
            <ul className="flex flex-col gap-3">
              {insights.slice(0, 3).map((i) => (
                <li key={i.id} className="text-sm">
                  {i.href ? (
                    <Link to={i.href} className="font-medium hover:underline">
                      {i.title}
                    </Link>
                  ) : (
                    <p className="font-medium">{i.title}</p>
                  )}
                  <p className="text-muted-foreground">{i.description}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      {/* 8. Weekly review CTA */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ClipboardCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium">Haftalik review</p>
            <p className="text-sm text-muted-foreground">
              {hasReview
                ? 'Shu hafta review yozilgan. Kerak bo‘lsa yangilang.'
                : !lastWeekReviewed && !isWeekend
                  ? 'O‘tgan hafta review qilinmagan — 10 daqiqada natijalarni ko‘rib chiqing.'
                  : 'Hafta oxirida natijalar va keyingi hafta ustuvorliklarini ko‘rib chiqing.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!lastWeekReviewed && (
            <Button asChild variant="outline">
              <Link to={`/planning/reviews/${lastWeek}`}>O‘tgan hafta</Link>
            </Button>
          )}
          <Button asChild>
            <Link to={`/planning/reviews/${week}`}>{hasReview ? 'Review’ni ochish' : 'Review yozish'}</Link>
          </Button>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ListTodoIcon className="size-3.5" aria-hidden="true" /> Barcha ko‘rsatkichlar kiritilgan ma’lumotlardan avtomatik hisoblanadi.
      </p>
    </div>
  )
}

