import { CheckCircle2Icon, FilePenLineIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { WEEKLY_PLAN_STATUS_LABELS } from '@/constants/labels'
import type { DateKey } from '@/services/date'
import type { WeeklyPlan } from '@/types'
import { weeklyPlanService } from '../service'

const HINTS: Record<WeeklyPlan['status'], string> = {
  draft: 'Reja qoralama holatida: ustuvor natijalarni tanlang, vazifalarni kunlarga taqsimlang, so‘ng rejani boshlang.',
  active: 'Reja faol. Hafta oxirida review yozing — u rejani avtomatik yakunlaydi.',
  completed: 'Hafta yakunlangan. Kerak bo‘lsa, qayta ochib tuzatish mumkin.',
}

/** Plan lifecycle: draft → active → completed (completed also set by saving the weekly review). */
export function PlanStatusBar({ week, plan }: { week: DateKey; plan: WeeklyPlan }) {
  const tone = plan.status === 'active' ? 'primary' : plan.status === 'completed' ? 'success' : 'muted'
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="status">
      <div className="flex items-start gap-3">
        <StatusBadge tone={tone} className="mt-0.5 shrink-0">
          {WEEKLY_PLAN_STATUS_LABELS[plan.status]}
        </StatusBadge>
        <p className="text-sm text-muted-foreground">{HINTS[plan.status]}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {plan.status === 'draft' && (
          <Button size="sm" onClick={() => weeklyPlanService.setStatus(week, 'active')}>
            <PlayIcon /> Rejani boshlash
          </Button>
        )}
        {plan.status === 'active' && (
          <>
            <Button size="sm" variant="ghost" onClick={() => weeklyPlanService.setStatus(week, 'draft')}>
              <FilePenLineIcon /> Qoralamaga qaytarish
            </Button>
            <Button size="sm" variant="outline" onClick={() => weeklyPlanService.setStatus(week, 'completed')}>
              <CheckCircle2Icon /> Haftani yakunlash
            </Button>
          </>
        )}
        {plan.status === 'completed' && (
          <Button size="sm" variant="outline" onClick={() => weeklyPlanService.setStatus(week, 'active')}>
            <RotateCcwIcon /> Qayta ochish
          </Button>
        )}
      </div>
    </div>
  )
}
