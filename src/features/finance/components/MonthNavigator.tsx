import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { addMonthsKey, currentMonthKey, formatMonth, MONTH_KEY_RE, type MonthKey } from '@/services/date'

export function useSelectedMonth(): [MonthKey, (m: MonthKey) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('month')
  const current = currentMonthKey()
  const month = raw && MONTH_KEY_RE.test(raw) ? raw : current
  const setMonth = (m: MonthKey) => {
    const next = new URLSearchParams(params)
    if (m === current) next.delete('month')
    else next.set('month', m)
    setParams(next, { replace: true })
  }
  return [month, setMonth]
}

export function MonthNavigator({ month, onChange }: { month: MonthKey; onChange: (m: MonthKey) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onChange(addMonthsKey(month, -1))} aria-label="Oldingi oy">
        <ChevronLeftIcon />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium capitalize" aria-live="polite">
        {formatMonth(month)}
      </span>
      <Button variant="outline" size="icon" onClick={() => onChange(addMonthsKey(month, 1))} aria-label="Keyingi oy">
        <ChevronRightIcon />
      </Button>
      {month !== currentMonthKey() && (
        <Button variant="ghost" size="sm" onClick={() => onChange(currentMonthKey())}>
          Joriy oy
        </Button>
      )}
    </div>
  )
}
