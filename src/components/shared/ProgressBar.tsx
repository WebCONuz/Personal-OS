import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  label?: string
  showValue?: boolean
  className?: string
  tone?: 'default' | 'success' | 'warning' | 'destructive'
  size?: 'sm' | 'md'
}

const toneClass = {
  default: '',
  success: '[&_[data-slot=progress-indicator]]:bg-success',
  warning: '[&_[data-slot=progress-indicator]]:bg-warning',
  destructive: '[&_[data-slot=progress-indicator]]:bg-destructive',
}

export function ProgressBar({ value, label, showValue = true, className, tone = 'default', size = 'md' }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Progress value={v} aria-label={label ?? 'Progress'} className={cn(size === 'sm' ? 'h-1.5' : 'h-2', toneClass[tone])} />
      {showValue && <span className="tabular w-10 shrink-0 text-right text-xs text-muted-foreground">{v}%</span>}
    </div>
  )
}
