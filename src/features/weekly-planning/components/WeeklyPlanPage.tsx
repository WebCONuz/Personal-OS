import { ArrowRightIcon, CalendarPlusIcon, ClipboardCheckIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { taskService } from '@/features/tasks/service'
import { useCollection, useToday } from '@/hooks/useData'
import { isOpen } from '@/services/analytics'
import { formatWeekRange, startOfWeekKey } from '@/services/date'
import { useWeekOverview } from '../hooks'
import { weeklyPlanService } from '../service'
import { AddTasksDialog } from './AddTasksDialog'
import { CapacityCard } from './CapacityCard'
import { PlanStatusBar } from './PlanStatusBar'
import { ChallengeCard } from './ChallengeCard'
import { PrioritiesCard } from './PrioritiesCard'
import { WeekBoard } from './WeekBoard'
import { useSelectedWeek, WeekNavigator } from './WeekNavigator'

export function WeeklyPlanPage() {
  const [week, setWeek] = useSelectedWeek()
  const today = useToday()
  const { plan, tasks, completion, capacity } = useWeekOverview(week)
  const reviews = useCollection('reviews')
  const [adding, setAdding] = useState(false)
  const isPast = week < startOfWeekKey(today)
  const openTasks = tasks.filter(isOpen)
  const review = reviews.find((r) => r.periodType === 'weekly' && r.periodStart === week)

  const moveOpen = async () => {
    const ok = await confirm({
      title: `${openTasks.length} ta ochiq vazifani keyingi haftaga ko‘chirish?`,
      description: 'Faqat siz tanlaganda ko‘chiriladi. Ko‘chirishdan oldin ularning hali dolzarbligini o‘ylab ko‘ring — ba’zilarini bekor qilish ham to‘g‘ri qaror.',
      confirmLabel: 'Ko‘chirish',
    })
    if (ok) taskService.moveOpenToNextWeek(openTasks.map((t) => t.id), week)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WeekNavigator week={week} onChange={setWeek} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to={`/planning/reviews/${week}`}>
              <ClipboardCheckIcon /> {review ? 'Review’ni ochish' : 'Haftalik review'}
            </Link>
          </Button>
          <Button onClick={() => setAdding(true)}>
            <PlusIcon /> Vazifa qo‘shish
          </Button>
        </div>
      </div>

      {!plan && tasks.length === 0 ? (
        <EmptyState
          icon={CalendarPlusIcon}
          title={`${formatWeekRange(week)} uchun reja yo‘q`}
          description="Avval 3–5 ta ustuvor natijani belgilang, keyin ularni vazifalarga ajratib, kunlarga taqsimlang. Bo‘sh vaqtning hammasini band qilmang."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => weeklyPlanService.create(week)}>Haftani rejalashtirish</Button>
              <Button variant="outline" onClick={() => setAdding(true)}>
                Vazifa qo‘shish
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {plan ? (
            <PlanStatusBar week={week} plan={plan} />
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Bu haftaga vazifalar kiritilgan, lekin reja (ustuvorliklar, sig‘im) hali yaratilmagan.</p>
              <Button size="sm" variant="outline" onClick={() => weeklyPlanService.create(week)}>Reja yaratish</Button>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <PrioritiesCard week={week} plan={plan} />
            <CapacityCard week={week} plan={plan} capacity={capacity} />
            <SectionCard title="Haftalik progress" description="Bekor qilingan vazifalar hisobga olinmaydi" className="md:col-span-2 xl:col-span-1">
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="tabular text-2xl font-semibold">{completion.percent}%</span>
                  <span className="tabular text-sm text-muted-foreground">
                    {completion.done} / {completion.total} vazifa
                  </span>
                </div>
                <ProgressBar value={completion.percent} showValue={false} label="Haftalik bajarilish" tone={completion.percent === 100 && completion.total > 0 ? 'success' : 'default'} />
                {isPast && openTasks.length > 0 && (
                  <Button variant="outline" size="sm" onClick={moveOpen} className="self-start">
                    <ArrowRightIcon /> Ochiq {openTasks.length} ta vazifani keyingi haftaga
                  </Button>
                )}
              </div>
            </SectionCard>
          </div>

          <section aria-labelledby="board-title" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h2 id="board-title" className="text-base font-semibold">
                Kunlar bo‘yicha taqsimot
              </h2>
              <span className="text-xs text-muted-foreground">Vazifa kunini kartadagi tanlov orqali o‘zgartiring</span>
            </div>
            {tasks.length > 0 ? (
              <WeekBoard week={week} tasks={tasks} />
            ) : (
              <EmptyState
                compact
                title="Bu haftaga vazifa kiritilmagan"
                description="Ustuvor natijalarni amalga oshiradigan vazifalarni qo‘shing."
                action={
                  <Button size="sm" onClick={() => setAdding(true)}>
                    <PlusIcon /> Vazifa qo‘shish
                  </Button>
                }
              />
            )}
          </section>

          <ChallengeCard week={week} plan={plan} />
        </>
      )}

      <AddTasksDialog week={week} open={adding} onOpenChange={setAdding} />
    </div>
  )
}
