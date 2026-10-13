import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, CircleIcon, SaveIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { weeklyPlanService } from '@/features/weekly-planning/service'
import { useCollection, useLifeAreas, useProfile } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { addDaysKey, formatMinutes, formatWeekRange, isValidDateKey, startOfWeekKey } from '@/services/date'
import { useWeekReviewStats } from '../hooks'
import { EMPTY_REVIEW, reviewService, type ReviewContent } from '../service'

const TEXT_FIELDS: Array<{ key: keyof Pick<ReviewContent, 'wins' | 'worked' | 'blockers' | 'lessons'>; label: string; placeholder: string }> = [
  { key: 'wins', label: 'Bu haftadagi eng muhim natijalar', placeholder: 'Nima tayyor bo‘ldi? Qaysi natija bilan faxrlanasiz?' },
  { key: 'worked', label: 'Nimalar yaxshi ishladi?', placeholder: 'Qaysi odat, vaqt yoki yondashuv foyda berdi?' },
  { key: 'blockers', label: 'Nima to‘sqinlik qildi?', placeholder: 'Ayblovsiz: sabablarini yozing — vaqt, energiya, noaniqlik, kutilmagan ishlar…' },
  { key: 'lessons', label: 'Asosiy saboq', placeholder: 'Keyingi haftaga olib o‘tiladigan bitta xulosa' },
]

export function WeeklyReviewPage() {
  const params = useParams()
  const navigate = useNavigate()
  const weekStart = params.weekStart && isValidDateKey(params.weekStart) ? startOfWeekKey(params.weekStart) : null
  const reviews = useCollection('reviews')
  const plans = useCollection('weeklyPlans')
  const areas = useLifeAreas({ activeOnly: true })
  const profile = useProfile()
  const stats = useWeekReviewStats(weekStart ?? '2000-01-03')
  const existing = reviews.find((r) => r.periodType === 'weekly' && r.periodStart === weekStart)
  const [form, setForm] = useState<ReviewContent>(EMPTY_REVIEW)
  const [priorities, setPriorities] = useState<string[]>(['', '', '', '', ''])

  useEffect(() => {
    const base = existing ?? EMPTY_REVIEW
    setForm({ ...EMPTY_REVIEW, ...base })
    setPriorities([...base.nextPriorities, '', '', '', '', ''].slice(0, 5))
    // Re-initialise only when switching weeks or after the first save creates the record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, existing?.id])

  if (!weekStart) {
    return <EmptyState title="Hafta noto‘g‘ri ko‘rsatilgan" action={<Button asChild variant="outline"><Link to="/planning/reviews">Review’larga qaytish</Link></Button>} />
  }

  const nextWeek = addDaysKey(weekStart, 7)
  const set = <K extends keyof ReviewContent>(key: K, value: ReviewContent[K]) => setForm((f) => ({ ...f, [key]: value }))
  const cleanPriorities = priorities.map((p) => p.trim()).filter(Boolean)

  const save = (e: FormEvent) => {
    e.preventDefault()
    reviewService.saveWeekly(weekStart, { ...form, nextPriorities: cleanPriorities })
  }

  const handOver = async () => {
    const nextPlan = plans.find((p) => p.weekStart === nextWeek)
    if (nextPlan && nextPlan.priorities.length > 0) {
      const ok = await confirm({
        title: 'Keyingi hafta ustuvorliklari almashtirilsinmi?',
        description: `Keyingi hafta rejasida allaqachon ${nextPlan.priorities.length} ta ustuvor natija bor. Ular shu review’dagi ro‘yxat bilan almashtiriladi.`,
        confirmLabel: 'Almashtirish',
      })
      if (!ok) return
    }
    reviewService.saveWeekly(weekStart, { ...form, nextPriorities: cleanPriorities })
    if (weeklyPlanService.setPriorities(nextWeek, cleanPriorities)) navigate(`/planning?week=${nextWeek}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/planning/reviews">
            <ArrowLeftIcon /> Review’lar
          </Link>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Haftalik review · {formatWeekRange(weekStart)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Maqsad — o‘zingizni baholash emas, keyingi haftani aniqroq rejalash. {existing ? 'Saqlangan review’ni tahrirlayapsiz.' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" asChild aria-label="Oldingi hafta review’i">
              <Link to={`/planning/reviews/${addDaysKey(weekStart, -7)}`}>
                <ArrowLeftIcon />
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild aria-label="Keyingi hafta review’i">
              <Link to={`/planning/reviews/${nextWeek}`}>
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Vazifalar" value={`${stats.completion.done} / ${stats.completion.total}`} hint={`${stats.completion.percent}% bajarildi`} />
        <StatCard label="Qayd etilgan vaqt" value={formatMinutes(stats.minutes)} hint={stats.byArea[0] ? `Ko‘pi: ${stats.byArea[0].name}` : 'Vaqt yozuvlari yo‘q'} />
        <StatCard label="Odatlar" value={stats.habitRate === null ? '—' : `${stats.habitRate}%`} hint={stats.habitRate === null ? 'Faol odat yo‘q' : 'O‘rtacha bajarilish'} />
        {profile.gamificationEnabled ? (
          <StatCard label="XP" value={`+${stats.xp}`} hint="Shu hafta topilgan" />
        ) : (
          <StatCard label="Ustuvor natijalar" value={`${stats.priorities.filter((p) => p.done).length} / ${stats.priorities.length}`} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={save} className="flex flex-col gap-6 lg:col-span-2" noValidate>
          <SectionCard title="Tahlil">
            <div className="flex flex-col gap-4">
              {TEXT_FIELDS.map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`review-${f.key}`}>{f.label}</Label>
                  <Textarea id={`review-${f.key}`} rows={3} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
                </div>
              ))}
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">Qaysi soha e’tiborsiz qoldi?</legend>
                <p className="text-xs text-muted-foreground">
                  Bu hafta faollik qayd etilmagan sohalar:{' '}
                  {stats.quietAreas.length ? stats.quietAreas.map((a) => a.name).join(', ') : 'yo‘q — barcha sohalarda harakat bor'}.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {areas.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.neglectedAreaIds.includes(a.id)}
                        onCheckedChange={(checked) =>
                          set('neglectedAreaIds', checked ? [...form.neglectedAreaIds, a.id] : form.neglectedAreaIds.filter((id) => id !== a.id))
                        }
                      />
                      {a.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </SectionCard>

          <SectionCard title="Davom ettirish / To‘xtatish / Boshlash">
            <div className="grid gap-4 md:grid-cols-3">
              {(
                [
                  ['keepDoing', 'Davom ettirish'],
                  ['stopDoing', 'To‘xtatish'],
                  ['startDoing', 'Boshlash'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`review-${key}`}>{label}</Label>
                  <Textarea id={`review-${key}`} rows={3} value={form[key]} onChange={(e) => set(key, e.target.value)} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Keyingi hafta uchun 3–5 ustuvor natija">
            <div className="flex flex-col gap-2">
              {priorities.map((p, i) => (
                <Input
                  key={i}
                  value={p}
                  onChange={(e) => setPriorities((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={i < 3 ? `${i + 1}-natija` : `${i + 1}-natija (ixtiyoriy)`}
                  aria-label={`Keyingi hafta ${i + 1}-ustuvor natijasi`}
                />
              ))}
              <fieldset className="mt-2 flex flex-col gap-2">
                <legend className="text-sm font-medium">Energiya darajasi (ixtiyoriy)</legend>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant={form.energy === n ? 'default' : 'outline'}
                      aria-pressed={form.energy === n}
                      onClick={() => set('energy', form.energy === n ? undefined : n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </fieldset>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handOver} disabled={cleanPriorities.length === 0}>
              <ArrowRightIcon /> Saqlash va keyingi hafta rejasiga o‘tkazish
            </Button>
            <Button type="submit">
              <SaveIcon /> Review’ni saqlash
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          <SectionCard title="Ustuvor natijalar">
            {stats.priorities.length ? (
              <ul className="flex flex-col gap-2 text-sm">
                {stats.priorities.map((p) => (
                  <li key={p.id} className="flex items-start gap-2">
                    {p.done ? (
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-label="Erishildi" />
                    ) : (
                      <CircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Erishilmadi" />
                    )}
                    <span className={cn(p.done && 'text-muted-foreground')}>{p.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Bu hafta uchun ustuvor natija belgilanmagan.</p>
            )}
          </SectionCard>
          <SectionCard title="Bajarilgan vazifalar" description={`${stats.doneTasks.length} ta`}>
            {stats.doneTasks.length ? (
              <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto text-sm">
                {stats.doneTasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-2">
                    <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    {t.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Bajarilgan vazifa yo‘q.</p>
            )}
            {stats.openTasks.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{stats.openTasks.length} ta vazifa ochiq qoldi.</p>}
          </SectionCard>
          {stats.byArea.length > 0 && (
            <SectionCard title="Vaqt taqsimoti">
              <ul className="flex flex-col gap-1.5 text-sm">
                {stats.byArea.map((a) => (
                  <li key={a.areaId ?? 'none'} className="flex justify-between gap-2">
                    <span>{a.name}</span>
                    <span className="tabular text-muted-foreground">{formatMinutes(a.minutes)}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
