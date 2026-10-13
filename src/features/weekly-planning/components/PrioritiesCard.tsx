import { PlusIcon, StarIcon, XIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { GoalSelect } from '@/components/forms/selects'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useCollection } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import type { DateKey } from '@/services/date'
import type { WeeklyPlan } from '@/types'
import { MAX_PRIORITIES, weeklyPlanService } from '../service'

export function PrioritiesCard({ week, plan }: { week: DateKey; plan?: WeeklyPlan }) {
  const goals = useCollection('goals')
  const [title, setTitle] = useState('')
  const [goalId, setGoalId] = useState('')
  const priorities = plan?.priorities ?? []
  const full = priorities.length >= MAX_PRIORITIES

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (weeklyPlanService.addPriority(week, title, goalId)) {
      setTitle('')
      setGoalId('')
    }
  }

  return (
    <SectionCard
      title="Haftaning ustuvor natijalari"
      description="3–5 ta natija: hafta oxirida nima tayyor bo‘lsa, hafta muvaffaqiyatli bo‘ladi?"
    >
      {priorities.length > 0 && (
        <ol className="mb-3 flex flex-col gap-1.5">
          {priorities.map((p, i) => {
            const goal = p.goalId ? goals.find((g) => g.id === p.goalId) : undefined
            return (
              <li key={p.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <Checkbox
                  checked={p.done}
                  onCheckedChange={() => weeklyPlanService.togglePriority(week, p.id)}
                  aria-label={`“${p.title}” natijasini ${p.done ? 'ochiq' : 'erishilgan'} deb belgilash`}
                />
                <span className="tabular w-4 text-xs text-muted-foreground">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', p.done && 'text-muted-foreground line-through')}>{p.title}</p>
                  {goal && <p className="truncate text-xs text-muted-foreground">Maqsad: {goal.title}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`“${p.title}” natijasini olib tashlash`}
                  className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => weeklyPlanService.removePriority(week, p.id)}
                >
                  <XIcon />
                </Button>
              </li>
            )
          })}
        </ol>
      )}
      {priorities.length === 0 && (
        <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <StarIcon className="size-4" aria-hidden="true" /> Hali ustuvor natija tanlanmagan.
        </p>
      )}
      {!full ? (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Portfolio saytining birinchi versiyasini chiqarish" aria-label="Yangi ustuvor natija" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <GoalSelect value={goalId} onChange={(e) => setGoalId(e.target.value)} emptyLabel="Maqsadga bog‘lanmagan" aria-label="Bog‘langan maqsad" className="flex-1" />
            <Button type="submit" variant="outline" disabled={!title.trim()}>
              <PlusIcon /> Qo‘shish
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">Maksimal {MAX_PRIORITIES} ta natija. Kamroq — aniqroq.</p>
      )}
    </SectionCard>
  )
}
