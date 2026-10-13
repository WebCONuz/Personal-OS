import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useToday } from '@/hooks/useData'
import { addDaysKey, formatWeekRange, isValidDateKey, startOfWeekKey, type DateKey } from '@/services/date'

/** Selected week lives in the URL (?week=YYYY-MM-DD) so it survives refresh and can be linked. */
export function useSelectedWeek(): [DateKey, (week: DateKey) => void] {
  const today = useToday()
  const [params, setParams] = useSearchParams()
  const raw = params.get('week')
  const week = raw && isValidDateKey(raw) ? startOfWeekKey(raw) : startOfWeekKey(today)
  const setWeek = (w: DateKey) => {
    const next = new URLSearchParams(params)
    if (w === startOfWeekKey(today)) next.delete('week')
    else next.set('week', w)
    setParams(next, { replace: true })
  }
  return [week, setWeek]
}

export function WeekNavigator({ week, onChange }: { week: DateKey; onChange: (w: DateKey) => void }) {
  const today = useToday()
  const current = startOfWeekKey(today)
  const label = week === current ? 'Shu hafta' : week === addDaysKey(current, 7) ? 'Keyingi hafta' : week === addDaysKey(current, -7) ? 'O‘tgan hafta' : null
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onChange(addDaysKey(week, -7))} aria-label="Oldingi hafta">
        <ChevronLeftIcon />
      </Button>
      <div className="min-w-40 text-center" aria-live="polite">
        <div className="text-sm font-medium">{formatWeekRange(week)}</div>
        {label && <div className="text-xs text-muted-foreground">{label}</div>}
      </div>
      <Button variant="outline" size="icon" onClick={() => onChange(addDaysKey(week, 7))} aria-label="Keyingi hafta">
        <ChevronRightIcon />
      </Button>
      {week !== current && (
        <Button variant="ghost" size="sm" onClick={() => onChange(current)}>
          Bugungi hafta
        </Button>
      )}
    </div>
  )
}
