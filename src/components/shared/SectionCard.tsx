import type { ReactNode } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function SectionCard({ title, description, action, children, className, contentClassName }: SectionCardProps) {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-base font-semibold">
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}
