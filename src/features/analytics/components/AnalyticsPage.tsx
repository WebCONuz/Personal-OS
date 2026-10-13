import { AwardIcon, InfoIcon, LightbulbIcon, LockIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Bars, CHART_COLORS, TrendLine } from '@/components/charts/Charts'
import { MoneyTotals } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatCard } from '@/components/shared/StatCard'
import { useGamification } from '@/features/gamification/hooks'
import { useGoalSummaries } from '@/features/goals/hooks'
import { useDbState, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { computeInsights, entriesBetween, minutesByArea, monthlyFinance, totalMinutes, weekCompletion } from '@/services/analytics'
import { addDaysKey, endOfWeekKey, formatDateShort, formatMinutes, formatMonth, isoToDateKey, monthKeyOf, recentMonths, recentWeekStarts } from '@/services/date'
import { activityDays, habitWeekRate, longestStreak, STREAK_RULE_TEXT, streakSeries } from '@/services/gamification/streak'

export function AnalyticsPage() {
  const state = useDbState()
  const today = useToday()
  const goals = useGoalSummaries()
  const { enabled, level, streak, badges } = useGamification()
  const weeks = useMemo(() => recentWeekStarts(today, 8), [today])

  const data = useMemo(() => {
    const completion = weeks.map((w) => ({ hafta: formatDateShort(w), foiz: weekCompletion(state.tasks, w).percent, ...weekCompletion(state.tasks, w) }))
    const from = weeks[weeks.length - 4]
    const areaMinutes = minutesByArea(entriesBetween(state.timeEntries, from, endOfWeekKey(weeks[weeks.length - 1])), state)
    const weeklyMinutes = weeks.map((w) => ({ hafta: formatDateShort(w), daqiqa: totalMinutes(entriesBetween(state.timeEntries, w, endOfWeekKey(w))) }))
    const xpWeeks = weeks.map((w) => {
      const end = endOfWeekKey(w)
      return {
        hafta: formatDateShort(w),
        xp: state.xpEvents.filter((e) => {
          const d = isoToDateKey(e.createdAt)
          return d >= w && d <= end
        }).reduce((s, e) => s + e.points, 0),
      }
    })
    const habits = state.habits
      .filter((h) => h.active)
      .map((h) => ({
        habit: h,
        current: habitWeekRate(h, state.habitLogs, weeks[weeks.length - 1]),
        avg4: Math.round(weeks.slice(-4).reduce((s, w) => s + habitWeekRate(h, state.habitLogs, w), 0) / 4),
      }))
    const months = recentMonths(monthKeyOf(today), 6).map((m) => ({ month: m, ...monthlyFinance(state.transactions, m) }))
    const active = activityDays(state.tasks, state.habitLogs)
    const last30 = Array.from({ length: 30 }, (_, i) => addDaysKey(today, i - 29))
    const streakHistory = streakSeries(active, last30).map((p) => ({ kun: formatDateShort(p.date), streak: p.streak }))
    const streakStats = { longest: longestStreak(active), active30: last30.filter((d) => active.has(d)).length }
    return { completion, areaMinutes, weeklyMinutes, xpWeeks, habits, months, streakHistory, streakStats }
  }, [state, weeks, today])

  const insights = useMemo(() => computeInsights(state, today), [state, today])
  const totalDone = state.tasks.filter((t) => t.status === 'done').length
  const hasTasks = data.completion.some((c) => c.total > 0)
  const hasTime = data.weeklyMinutes.some((w) => w.daqiqa > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Bajarilgan vazifalar" value={totalDone} hint="jami" />
        <StatCard label="Faol maqsadlar" value={goals.filter((g) => g.goal.status === 'active').length} hint={`${goals.filter((g) => g.goal.status === 'completed').length} ta yakunlangan`} />
        <StatCard label="Qayd etilgan vaqt" value={formatMinutes(totalMinutes(entriesBetween(state.timeEntries, weeks[weeks.length - 4], today)))} hint="so‘nggi 4 hafta" />
        {enabled ? <StatCard label="Daraja" value={`${level.level}`} hint={`${level.totalXp} XP · ${streak} kun streak`} /> : <StatCard label="Streak" value={streak} hint="ketma-ket faol kun" />}
      </div>

      <SectionCard title={<span className="inline-flex items-center gap-2"><LightbulbIcon className="size-4" aria-hidden="true" /> Kuzatuvlar</span>} description="Qoidaga asoslangan, faqat sizning ma’lumotlaringizdan hisoblanadi">
        {insights.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {insights.map((i) => (
              <li key={i.id} className={cn('rounded-lg border px-4 py-3', i.tone === 'warning' && 'border-warning/40 bg-warning/5')}>
                {i.href ? (
                  <Link to={i.href} className="text-sm font-medium hover:underline">
                    {i.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium">{i.title}</p>
                )}
                <p className="mt-0.5 text-sm text-muted-foreground">{i.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Hozircha alohida e’tibor talab qiladigan holat topilmadi. Xulosalar uchun bir necha haftalik ma’lumot kerak — yetarli bo‘lmasa, tizim xulosa yasamaydi.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Streak tarixi" description={STREAK_RULE_TEXT}>
        <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
          <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div>
              <dt className="text-xs text-muted-foreground">Joriy streak</dt>
              <dd className="tabular text-xl font-semibold">{streak} kun</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Eng uzun streak</dt>
              <dd className="tabular text-xl font-semibold">{data.streakStats.longest} kun</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Faol kunlar (30 kun)</dt>
              <dd className="tabular text-xl font-semibold">{data.streakStats.active30} / 30</dd>
            </div>
          </dl>
          {data.streakStats.active30 > 0 ? (
            <TrendLine
              caption="So‘nggi 30 kundagi streak"
              data={data.streakHistory}
              xKey="kun"
              series={[{ key: 'streak', label: 'Streak (kun)', color: CHART_COLORS.primary }]}
              height={180}
            />
          ) : (
            <p className="text-sm text-muted-foreground">So‘nggi 30 kunda bajarilgan vazifa yoki odat qayd etilmagan.</p>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Haftalik bajarilish" description="So‘nggi 8 hafta, bekor qilinganlarsiz">
          {hasTasks ? (
            <Bars caption="Haftalik vazifa bajarilish foizi" data={data.completion.map(({ hafta, foiz }) => ({ hafta, foiz }))} xKey="hafta" series={[{ key: 'foiz', label: 'Bajarilish', color: CHART_COLORS.primary }]} formatter={(v) => `${v}%`} />
          ) : (
            <p className="text-sm text-muted-foreground">Haftalarga rejalashtirilgan vazifalar yo‘q.</p>
          )}
        </SectionCard>
        <SectionCard title="Haftalik qayd etilgan vaqt" description="So‘nggi 8 hafta">
          {hasTime ? (
            <Bars caption="Haftalik qayd etilgan vaqt" data={data.weeklyMinutes} xKey="hafta" series={[{ key: 'daqiqa', label: 'Vaqt', color: CHART_COLORS.primary }]} formatter={(v) => `${Math.round(v / 60)} s`} />
          ) : (
            <p className="text-sm text-muted-foreground">Vaqt yozuvlari yo‘q.</p>
          )}
        </SectionCard>
        <SectionCard title="Hayot sohalari bo‘yicha vaqt" description="So‘nggi 4 hafta">
          {data.areaMinutes.length ? (
            <Bars
              caption="So‘nggi 4 haftada sohalar bo‘yicha vaqt"
              data={data.areaMinutes.map((a) => ({ soha: a.name, daqiqa: a.minutes }))}
              xKey="soha"
              series={[{ key: 'daqiqa', label: 'Vaqt', color: CHART_COLORS.primary }]}
              layout="vertical"
              formatter={(v) => formatMinutes(v)}
              height={Math.max(120, data.areaMinutes.length * 34)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Ma’lumot yo‘q.</p>
          )}
        </SectionCard>
        <SectionCard title="Odatlar" description="Shu hafta va so‘nggi 4 hafta o‘rtachasi">
          {data.habits.length ? (
            <ul className="flex flex-col gap-3">
              {data.habits.map(({ habit, current, avg4 }) => (
                <li key={habit.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{habit.title}</span>
                    <span className="tabular text-xs text-muted-foreground">4 hafta: {avg4}%</span>
                  </div>
                  <ProgressBar value={current} label={`${habit.title} shu hafta`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Faol odat yo‘q.</p>
          )}
        </SectionCard>
        <SectionCard title="Maqsadlar progressi">
          {goals.filter((g) => g.goal.status === 'active').length ? (
            <ul className="flex flex-col gap-3">
              {goals
                .filter((g) => g.goal.status === 'active')
                .map((g) => (
                  <li key={g.goal.id}>
                    <Link to={`/goals/${g.goal.id}`} className="text-sm hover:underline">
                      {g.goal.title}
                    </Link>
                    <ProgressBar value={g.progress} size="sm" label={`${g.goal.title} progressi`} />
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Faol maqsad yo‘q.</p>
          )}
        </SectionCard>
        <SectionCard title="Oylik moliya" description="Har bir valyuta alohida">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">So‘nggi 6 oy daromad, xarajat va farq</caption>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 font-medium">Oy</th>
                  <th scope="col" className="py-2 font-medium">Daromad</th>
                  <th scope="col" className="py-2 font-medium">Xarajat</th>
                  <th scope="col" className="py-2 font-medium">Farq</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...data.months].reverse().map((m) => (
                  <tr key={m.month}>
                    <th scope="row" className="py-2 text-left font-normal capitalize">{formatMonth(m.month)}</th>
                    <td className="py-2"><MoneyTotals totals={m.income} emptyLabel="—" /></td>
                    <td className="py-2"><MoneyTotals totals={m.expense} emptyLabel="—" /></td>
                    <td className="py-2"><MoneyTotals totals={m.net} signed emptyLabel="—" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {enabled && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="XP tarixi" description="So‘nggi 8 hafta">
            {data.xpWeeks.some((w) => w.xp > 0) ? (
              <Bars caption="Haftalik XP" data={data.xpWeeks} xKey="hafta" series={[{ key: 'xp', label: 'XP', color: CHART_COLORS.primary }]} />
            ) : (
              <p className="text-sm text-muted-foreground">Hali XP yo‘q. Vazifa, odat yoki bosqich bajarilganda beriladi.</p>
            )}
          </SectionCard>
          <SectionCard title={<span className="inline-flex items-center gap-2"><AwardIcon className="size-4" aria-hidden="true" /> Nishonlar</span>} description={`${badges.filter((b) => b.earned).length} / ${badges.length} qo‘lga kiritilgan`}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {badges.map((b) => (
                <li key={b.id} className={cn('flex items-start gap-3 rounded-lg border px-3 py-2', !b.earned && 'border-dashed bg-muted/30')}>
                  {b.earned ? <AwardIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Qo‘lga kiritilgan" /> : <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Hali yo‘q" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.description} · <span className="tabular">{b.progress}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Ma’lumotlar oralig‘i: {formatDateShort(weeks[0])} – {formatDateShort(addDaysKey(weeks[weeks.length - 1], 6))}</p>
    </div>
  )
}
