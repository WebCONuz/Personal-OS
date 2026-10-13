import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

/** Empty states always suggest the next step via `action`. */
export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <Empty className={cn('border bg-card', compact ? 'gap-2 p-4' : 'p-8', className)}>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon aria-hidden="true" />
          </EmptyMedia>
        )}
        <EmptyTitle className="text-base font-medium">{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
