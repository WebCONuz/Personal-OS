import { TrophyIcon, XIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useProfile } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import type { DateKey } from '@/services/date'
import { XP_RULES } from '@/services/gamification/config'
import type { WeeklyPlan } from '@/types'
import { weeklyPlanService } from '../service'

export function ChallengeCard({ week, plan }: { week: DateKey; plan?: WeeklyPlan }) {
  const profile = useProfile()
  const [title, setTitle] = useState('')
  const challenge = plan?.challenge

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (title.trim() && weeklyPlanService.setChallenge(week, title)) setTitle('')
  }

  return (
    <SectionCard
      title={<span className="inline-flex items-center gap-2"><TrophyIcon className="size-4" aria-hidden="true" /> Haftalik challenge</span>}
      description={profile.gamificationEnabled ? `Ixtiyoriy kichik sinov · bajarilganda +${XP_RULES.challenge} XP` : 'Ixtiyoriy kichik sinov'}
    >
      {challenge ? (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={challenge.done}
            onCheckedChange={() => weeklyPlanService.toggleChallenge(week)}
            aria-label="Challenge bajarilganini belgilash"
          />
          <p className={cn('flex-1 text-sm', challenge.done && 'text-muted-foreground line-through')}>{challenge.title}</p>
          <Button variant="ghost" size="icon-xs" aria-label="Challenge’ni olib tashlash" onClick={() => weeklyPlanService.clearChallenge(week)}>
            <XIcon />
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: 5 kun ingliz tilida 20 daqiqa o‘qish" aria-label="Challenge matni" />
          <Button type="submit" variant="outline" disabled={!title.trim()}>
            Belgilash
          </Button>
        </form>
      )}
    </SectionCard>
  )
}
