import { FlameIcon, InfoIcon, SparklesIcon } from 'lucide-react'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SectionCard } from '@/components/shared/SectionCard'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { STREAK_RULE_TEXT } from '@/services/gamification/streak'
import { useGamification } from '../hooks'

export function LevelCard() {
  const { level, streak, badges } = useGamification()
  const earned = badges.filter((b) => b.earned).length
  return (
    <SectionCard title="Rivojlanish" description="XP faqat haqiqiy bajarilgan ishlar uchun beriladi">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <SparklesIcon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold">{level.level}-daraja</p>
              <p className="tabular text-xs text-muted-foreground">{level.totalXp} XP jami</p>
            </div>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-lg font-semibold">
              <FlameIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="tabular">{streak}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" aria-label="Streak qoidasi">
                    <InfoIcon className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">{STREAK_RULE_TEXT}</TooltipContent>
              </Tooltip>
            </p>
            <p className="text-xs text-muted-foreground">kunlik streak</p>
          </div>
        </div>
        <div>
          <ProgressBar value={level.percent} showValue={false} label="Keyingi darajagacha" />
          <p className="tabular mt-1 text-xs text-muted-foreground">
            Keyingi darajagacha {level.nextLevelXp - level.totalXp} XP · {earned} / {badges.length} nishon
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
