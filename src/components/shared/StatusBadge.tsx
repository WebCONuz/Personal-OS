import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'muted'

const toneClass: Record<Tone, string> = {
  neutral: 'border-border bg-background text-foreground',
  primary: 'border-transparent bg-accent text-accent-foreground',
  success: 'border-transparent bg-success/12 text-success',
  warning: 'border-transparent bg-warning/15 text-warning-foreground',
  danger: 'border-transparent bg-destructive/10 text-destructive',
  muted: 'border-transparent bg-muted text-muted-foreground',
}

export function StatusBadge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-medium', toneClass[tone], className)}>
      {children}
    </Badge>
  )
}

export const STATUS_TONES: Record<string, Tone> = {
  planned: 'muted',
  active: 'primary',
  paused: 'warning',
  completed: 'success',
  cancelled: 'muted',
  todo: 'neutral',
  in_progress: 'primary',
  done: 'success',
  draft: 'muted',
}
