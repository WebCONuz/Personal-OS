import { ClipboardCheckIcon, Trash2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { useCollection, useToday } from '@/hooks/useData'
import { addDaysKey, formatDate, formatWeekRange, startOfWeekKey } from '@/services/date'
import { reviewService } from '../service'

export function ReviewsPage() {
  const reviews = useCollection('reviews')
  const today = useToday()
  const currentWeek = startOfWeekKey(today)
  const lastWeek = addDaysKey(currentWeek, -7)
  const weekly = useMemo(() => reviews.filter((r) => r.periodType === 'weekly').sort((a, b) => b.periodStart.localeCompare(a.periodStart)), [reviews])
  const daily = useMemo(() => reviews.filter((r) => r.periodType === 'daily').sort((a, b) => b.periodStart.localeCompare(a.periodStart)).slice(0, 14), [reviews])
  const hasLast = weekly.some((r) => r.periodStart === lastWeek)
  const hasCurrent = weekly.some((r) => r.periodStart === currentWeek)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { week: currentWeek, label: 'Shu hafta', done: hasCurrent },
          { week: lastWeek, label: 'O‘tgan hafta', done: hasLast },
        ].map((w) => (
          <div key={w.week} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium">{w.label}</p>
              <p className="text-xs text-muted-foreground">
                {formatWeekRange(w.week)} · {w.done ? 'review yozilgan' : 'review yozilmagan'}
              </p>
            </div>
            <Button asChild size="sm" variant={w.done ? 'outline' : 'default'}>
              <Link to={`/planning/reviews/${w.week}`}>{w.done ? 'Ochish' : 'Review yozish'}</Link>
            </Button>
          </div>
        ))}
      </div>

      <SectionCard title="Haftalik review’lar tarixi">
        {weekly.length === 0 ? (
          <EmptyState
            compact
            icon={ClipboardCheckIcon}
            title="Hali review yozilmagan"
            description="Hafta oxirida 10 daqiqa ajrating: natijalar, to‘siqlar va keyingi hafta ustuvorliklari."
            action={
              <Button asChild size="sm">
                <Link to={`/planning/reviews/${currentWeek}`}>Birinchi review</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {weekly.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/planning/reviews/${r.periodStart}`} className="text-sm font-medium hover:underline">
                    {formatWeekRange(r.periodStart)}
                  </Link>
                  {r.wins && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{r.wins}</p>}
                  {r.nextPriorities.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Keyingi hafta: {r.nextPriorities.join(' · ')}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${formatWeekRange(r.periodStart)} review’ini o‘chirish`}
                  onClick={async () => {
                    if (await confirmDelete('Review')) reviewService.remove(r.id)
                  }}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {daily.length > 0 && (
        <SectionCard title="Kun yakunlari" description="So‘nggi 14 ta qayd">
          <ul className="divide-y">
            {daily.map((r) => (
              <li key={r.id} className="py-2.5 text-sm">
                <p className="text-xs text-muted-foreground">{formatDate(r.periodStart, 'EEEE, d MMMM')}</p>
                {r.wins && <p>{r.wins}</p>}
                {r.lessons && <p className="text-muted-foreground">{r.lessons}</p>}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}
