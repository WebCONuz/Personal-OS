import {
  addDaysKey,
  diffDays,
  endOfWeekKey,
  isoToDateKey,
  monthKeyOf,
  recentWeekStarts,
  startOfWeekKey,
  todayKey,
  type DateKey,
  type MonthKey,
} from '@/services/date'
import { sumByCurrency, type CurrencyTotals } from '@/services/money'
import { taskCompletion, type CompletionStats } from '@/services/progress'
import type { Budget, Currency, DbState, LifeArea, SavingsContribution, Task, TimeEntry, Transaction, WeeklyPlan } from '@/types'

// ---------- Tasks & weeks ----------

/** Tasks that belong to a week: planned for it (weekStart) or scheduled on one of its days. */
export function tasksOfWeek(tasks: readonly Task[], weekStart: DateKey): Task[] {
  const end = endOfWeekKey(weekStart)
  return tasks.filter(
    (t) => t.weekStart === weekStart || (t.scheduledDate !== undefined && t.scheduledDate >= weekStart && t.scheduledDate <= end),
  )
}

export function weekCompletion(tasks: readonly Task[], weekStart: DateKey): CompletionStats {
  return taskCompletion(tasksOfWeek(tasks, weekStart))
}

export function plannedMinutes(tasks: readonly Task[]): number {
  return tasks.filter((t) => t.status !== 'cancelled').reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0)
}

export interface CapacityInfo {
  capacity: number
  /** Capacity minus the buffer: what can realistically be planned. */
  plannable: number
  planned: number
  overBy: number
  isOverplanned: boolean
  usagePercent: number
}

export function capacityInfo(planned: number, capacity: number, bufferPercent: number): CapacityInfo {
  const plannable = Math.round(capacity * (1 - bufferPercent / 100))
  return {
    capacity,
    plannable,
    planned,
    overBy: Math.max(0, planned - plannable),
    isOverplanned: planned > plannable,
    usagePercent: plannable > 0 ? Math.round((planned / plannable) * 100) : planned > 0 ? 100 : 0,
  }
}

export function isOverdue(task: Task, today: DateKey = todayKey()): boolean {
  return !!task.dueDate && task.dueDate < today && task.status !== 'done' && task.status !== 'cancelled'
}

export function isOpen(task: Task): boolean {
  return task.status === 'todo' || task.status === 'in_progress'
}

/** Open tasks not placed into any week or day (they may still have a due date). */
export function isUnplanned(task: Task): boolean {
  return isOpen(task) && !task.weekStart && !task.scheduledDate
}

/** Inbox = quick captures not yet planned: no week, no day, no due date. */
export function isInbox(task: Task): boolean {
  return isOpen(task) && !task.weekStart && !task.scheduledDate && !task.dueDate
}

/** Today's agenda: scheduled for today or due today (open), plus everything completed today. */
export function tasksForDay(tasks: readonly Task[], day: DateKey): Task[] {
  return tasks.filter((t) => {
    if (t.status === 'done' && t.completedAt && isoToDateKey(t.completedAt) === day) return true
    if (t.status === 'cancelled') return false
    return t.scheduledDate === day || (t.dueDate === day && isOpen(t))
  })
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const

export function sortByPriority(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      Number(a.status === 'done') - Number(b.status === 'done') ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
  )
}

// ---------- Time ----------

export function entryLifeAreaId(entry: TimeEntry, state: Pick<DbState, 'tasks' | 'projects' | 'learningItems'>): string | undefined {
  if (entry.lifeAreaId) return entry.lifeAreaId
  if (entry.taskId) {
    const task = state.tasks.find((t) => t.id === entry.taskId)
    if (task?.lifeAreaId) return task.lifeAreaId
    if (task?.projectId) {
      return state.projects.find((p) => p.id === task.projectId)?.lifeAreaId
    }
  }
  if (entry.projectId) return state.projects.find((p) => p.id === entry.projectId)?.lifeAreaId
  if (entry.learningItemId) return state.learningItems.find((l) => l.id === entry.learningItemId)?.lifeAreaId
  return undefined
}

export function entriesBetween(entries: readonly TimeEntry[], from: DateKey, to: DateKey): TimeEntry[] {
  return entries.filter((e) => e.date >= from && e.date <= to)
}

/** Time spent on a learning resource: entries linked directly or through a learning-session task. */
export function learningMinutes(learningItemId: string, entries: readonly TimeEntry[], tasks: readonly Task[]): number {
  const sessionIds = new Set(tasks.filter((t) => t.learningItemId === learningItemId).map((t) => t.id))
  return totalMinutes(entries.filter((e) => e.learningItemId === learningItemId || (e.taskId !== undefined && sessionIds.has(e.taskId))))
}

export function totalMinutes(entries: readonly TimeEntry[]): number {
  return entries.reduce((s, e) => s + e.durationMinutes, 0)
}

export interface AreaMinutes {
  areaId: string | null
  name: string
  minutes: number
}

export function minutesByArea(
  entries: readonly TimeEntry[],
  state: Pick<DbState, 'tasks' | 'projects' | 'learningItems' | 'lifeAreas'>,
): AreaMinutes[] {
  const map = new Map<string | null, number>()
  for (const e of entries) {
    const id = entryLifeAreaId(e, state) ?? null
    map.set(id, (map.get(id) ?? 0) + e.durationMinutes)
  }
  const nameOf = (id: string | null) => (id ? (state.lifeAreas.find((a) => a.id === id)?.name ?? 'Noma’lum') : 'Sohasiz')
  return [...map.entries()]
    .map(([areaId, minutes]) => ({ areaId, name: nameOf(areaId), minutes }))
    .sort((a, b) => b.minutes - a.minutes)
}

/** Task distribution (non-cancelled) by area for a set of tasks. */
export function tasksByArea(tasks: readonly Task[], lifeAreas: readonly LifeArea[]): Array<{ areaId: string | null; name: string; total: number; done: number }> {
  const map = new Map<string | null, { total: number; done: number }>()
  for (const t of tasks) {
    if (t.status === 'cancelled') continue
    const id = t.lifeAreaId ?? null
    const entry = map.get(id) ?? { total: 0, done: 0 }
    entry.total++
    if (t.status === 'done') entry.done++
    map.set(id, entry)
  }
  return [...map.entries()]
    .map(([areaId, v]) => ({ areaId, name: areaId ? (lifeAreas.find((a) => a.id === areaId)?.name ?? 'Noma’lum') : 'Sohasiz', ...v }))
    .sort((a, b) => b.total - a.total)
}

// ---------- Finance ----------

export interface MonthlyFinance {
  income: CurrencyTotals
  expense: CurrencyTotals
  net: CurrencyTotals
}

export function transactionsOfMonth(transactions: readonly Transaction[], month: MonthKey): Transaction[] {
  return transactions.filter((t) => monthKeyOf(t.date) === month)
}

export function monthlyFinance(transactions: readonly Transaction[], month: MonthKey): MonthlyFinance {
  const list = transactionsOfMonth(transactions, month)
  const income = sumByCurrency(list.filter((t) => t.type === 'income'))
  const expense = sumByCurrency(list.filter((t) => t.type === 'expense'))
  return { income, expense, net: { UZS: income.UZS - expense.UZS, USD: income.USD - expense.USD } }
}

export interface BudgetUsage {
  budget: Budget
  spent: number
  remaining: number
  percent: number
  exceeded: boolean
}

export function budgetUsage(budgets: readonly Budget[], transactions: readonly Transaction[], month: MonthKey): BudgetUsage[] {
  const expenses = transactionsOfMonth(transactions, month).filter((t) => t.type === 'expense')
  return budgets.map((budget) => {
    const spent = expenses
      .filter((t) => t.category === budget.category && t.currency === budget.currency)
      .reduce((s, t) => s + t.amount, 0)
    return {
      budget,
      spent,
      remaining: budget.amount - spent,
      percent: Math.round((spent / budget.amount) * 100),
      exceeded: spent > budget.amount,
    }
  })
}

export function savedAmount(savingsGoalId: string, contributions: readonly SavingsContribution[]): number {
  return contributions
    .filter((c) => c.savingsGoalId === savingsGoalId)
    .reduce((s, c) => s + (c.type === 'deposit' ? c.amount : -c.amount), 0)
}

export function expenseByCategory(transactions: readonly Transaction[], month: MonthKey, currency: Currency): Array<{ category: string; amount: number }> {
  const map = new Map<string, number>()
  for (const t of transactionsOfMonth(transactions, month)) {
    if (t.type !== 'expense' || t.currency !== currency) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
}

// ---------- Insights ----------

export interface Insight {
  id: string
  tone: 'info' | 'warning'
  title: string
  description: string
  href?: string
}

function planFor(plans: readonly WeeklyPlan[], weekStart: DateKey): WeeklyPlan | undefined {
  return plans.find((p) => p.weekStart === weekStart)
}

/** Earliest date we have any user data for — insights need enough history before drawing conclusions. */
function firstActivityDate(state: DbState): DateKey | null {
  const dates: string[] = []
  for (const t of state.tasks) dates.push(isoToDateKey(t.createdAt))
  for (const e of state.timeEntries) dates.push(e.date)
  for (const l of state.habitLogs) dates.push(l.date)
  if (dates.length === 0) return null
  return dates.sort()[0]
}

export function computeInsights(state: DbState, today: DateKey = todayKey()): Insight[] {
  const insights: Insight[] = []
  const currentWeek = startOfWeekKey(today)
  const pastWeeks = recentWeekStarts(addDaysKey(currentWeek, -7), 3)
  const first = firstActivityDate(state)
  const historyDays = first ? diffDays(today, first) : 0

  // 1. Consistently overplanned weeks (needs at least 2 past weeks with plans).
  const overplanned = pastWeeks.filter((w) => {
    const plan = planFor(state.weeklyPlans, w)
    if (!plan) return false
    return capacityInfo(plannedMinutes(tasksOfWeek(state.tasks, w)), plan.capacityMinutes, plan.bufferPercent).isOverplanned
  })
  const lowCompletion = pastWeeks.filter((w) => {
    const stats = weekCompletion(state.tasks, w)
    return stats.total >= 5 && stats.percent < 50
  })
  if (overplanned.length >= 2 || lowCompletion.length >= 2) {
    insights.push({
      id: 'overplanning',
      tone: 'warning',
      title: 'Haftalik reja doimiy ravishda katta',
      description:
        overplanned.length >= 2
          ? `So‘nggi 3 haftadan ${overplanned.length} tasida rejalashtirilgan vaqt mavjud vaqtdan oshgan. Kamroq, lekin muhimroq vazifalarni tanlab ko‘ring.`
          : `So‘nggi 3 haftadan ${lowCompletion.length} tasida vazifalarning yarmidan kami bajarilgan. Ehtimol, reja haqiqiy imkoniyatdan kattaroq.`,
      href: '/planning',
    })
  }

  // 2. Goals without movement for 14+ days.
  for (const goal of state.goals) {
    if (goal.status !== 'active') continue
    const created = isoToDateKey(goal.createdAt)
    if (diffDays(today, created) < 14) continue
    const activity = [created]
    for (const p of state.goalProgress) if (p.goalId === goal.id) activity.push(p.date)
    for (const t of state.tasks) if (t.goalId === goal.id && t.completedAt) activity.push(isoToDateKey(t.completedAt))
    for (const m of state.milestones) if (m.goalId === goal.id && m.completedAt) activity.push(isoToDateKey(m.completedAt))
    const last = activity.sort().at(-1)!
    const idle = diffDays(today, last)
    if (idle >= 14) {
      insights.push({
        id: `stalled-${goal.id}`,
        tone: 'info',
        title: `“${goal.title}” ${idle} kundan beri siljimagan`,
        description: 'Keyingi eng kichik qadamni belgilang yoki maqsadni vaqtincha to‘xtatib qo‘ying — bu ham ongli qaror.',
        href: `/goals/${goal.id}`,
      })
    }
  }

  // 3. Neglected life areas (needs 3+ weeks of history; only areas that the user actually uses).
  if (historyDays >= 21) {
    const from = pastWeeks[0]
    for (const area of state.lifeAreas) {
      if (!area.isActive) continue
      const used =
        state.goals.some((g) => g.lifeAreaId === area.id && (g.status === 'active' || g.status === 'planned')) ||
        state.habits.some((h) => h.lifeAreaId === area.id && h.active)
      if (!used) continue
      const recentTask = state.tasks.some(
        (t) => t.lifeAreaId === area.id && t.status === 'done' && t.completedAt && isoToDateKey(t.completedAt) >= from,
      )
      const recentTime = state.timeEntries.some((e) => e.date >= from && entryLifeAreaId(e, state) === area.id)
      const habitIds = new Set(state.habits.filter((h) => h.lifeAreaId === area.id).map((h) => h.id))
      const recentHabit = state.habitLogs.some((l) => l.completed && l.date >= from && habitIds.has(l.habitId))
      const goalIds = new Set(state.goals.filter((g) => g.lifeAreaId === area.id).map((g) => g.id))
      const recentProgress = state.goalProgress.some((p) => p.date >= from && goalIds.has(p.goalId))
      // Money records are activity of the finance area even though they carry no life-area link.
      const recentMoney =
        area.key === 'finance' &&
        (state.transactions.some((t) => t.date >= from) || state.savingsContributions.some((c) => c.date >= from))
      if (!recentTask && !recentTime && !recentHabit && !recentProgress && !recentMoney) {
        insights.push({
          id: `neglected-${area.id}`,
          tone: 'info',
          title: `“${area.name}” sohasi 3 haftadan beri e’tiborsiz`,
          description: 'Bu sohada faol maqsad yoki odat bor, lekin so‘nggi haftalarda hech qanday harakat qayd etilmagan.',
          href: '/goals',
        })
      }
    }
  }

  // 4. Planned vs actual time gap for last week.
  const lastWeek = pastWeeks[pastWeeks.length - 1]
  const lastWeekTasks = tasksOfWeek(state.tasks, lastWeek).filter((t) => t.status === 'done' && t.estimatedMinutes)
  if (lastWeekTasks.length >= 3) {
    const estimated = lastWeekTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
    const ids = new Set(lastWeekTasks.map((t) => t.id))
    const actual = state.timeEntries.filter((e) => e.taskId && ids.has(e.taskId)).reduce((s, e) => s + e.durationMinutes, 0)
    if (estimated >= 120 && actual >= 60) {
      const ratio = actual / estimated
      if (ratio > 1.5 || ratio < 0.5) {
        insights.push({
          id: 'estimate-gap',
          tone: 'info',
          title: ratio > 1.5 ? 'Vazifalar rejadagidan uzoqroq davom etmoqda' : 'Vazifalar rejadagidan tezroq bajarilmoqda',
          description: `O‘tgan hafta bajarilgan vazifalar uchun ${Math.round(estimated / 60)} soat rejalashtirilgan, amalda ${Math.round(actual / 60)} soat qayd etilgan. Baholashni moslashtirish mumkin.`,
          href: '/planning/time',
        })
      }
    }
  }

  // 5. Budgets exceeded this month.
  for (const usage of budgetUsage(state.budgets, state.transactions, monthKeyOf(today))) {
    if (usage.exceeded) {
      insights.push({
        id: `budget-${usage.budget.id}`,
        tone: 'warning',
        title: `“${usage.budget.category}” budjeti oshib ketdi`,
        description: `Bu oy belgilangan limitning ${usage.percent}% qismi sarflandi.`,
        href: '/finance',
      })
    }
  }

  return insights
}

