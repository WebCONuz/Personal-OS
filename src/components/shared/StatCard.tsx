import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: LucideIcon
  className?: string
}

export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('gap-1 px-4 py-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
      </div>
      <div className="tabular text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  )
}
