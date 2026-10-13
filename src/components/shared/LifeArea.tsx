import { Activity, BookOpen, Briefcase, GraduationCap, Heart, Rocket, Target, Wallet, type LucideIcon, type LucideProps } from 'lucide-react'
import { createElement } from 'react'
import { useLifeAreas } from '@/hooks/useData'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  rocket: Rocket,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  wallet: Wallet,
  target: Target,
  heart: Heart,
  activity: Activity,
}

/** Renders the icon of a life area by its stored icon name. */
export function LifeAreaIcon({ name, ...props }: LucideProps & { name?: string }) {
  return createElement((name && ICONS[name]) || Target, { 'aria-hidden': true, ...props })
}

export function LifeAreaBadge({ areaId, className }: { areaId?: string; className?: string }) {
  const areas = useLifeAreas()
  const area = areaId ? areas.find((a) => a.id === areaId) : undefined
  if (!area) return null
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <LifeAreaIcon name={area.icon} className="size-3.5" />
      {area.name}
    </span>
  )
}
