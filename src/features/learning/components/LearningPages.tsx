import { BookMarkedIcon, CalendarPlusIcon, CheckIcon, ExternalLinkIcon, LanguagesIcon, PencilIcon, PlayIcon, PlusIcon, SearchXIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterSelect, enumOptions, withAll } from '@/components/shared/FilterSelect'
import { SearchInput } from '@/components/shared/SearchInput'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { LEARNING_STATUS_LABELS, LEARNING_TYPE_LABELS } from '@/constants/labels'
import { LEARNING_STATUSES } from '@/data/schema/entities'
import { useTaskEditor } from '@/features/tasks/editor'
import { timeEntryService, timerService } from '@/features/time-tracking/service'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { entriesBetween, isOpen, learningMinutes, totalMinutes } from '@/services/analytics'
import { endOfWeekKey, formatDate, formatDateShort, formatMinutes, startOfWeekKey } from '@/services/date'
import type { LearningItem } from '@/types'
import { useLearningEditor, useVocabEditor } from '../editor'
import { ENGLISH_PRACTICE_PREFIX, learningService, vocabService } from '../service'

const STATUS_TONES: Record<LearningItem['status'], Tone> = { to_learn: 'muted', learning: 'primary', completed: 'success', paused: 'warning' }

export function ResourcesPage() {
  const items = useCollection('learningItems')
  const entries = useCollection('timeEntries')
  const notes = useCollection('knowledgeNotes')
  const tasks = useCollection('tasks')
  const skills = useCollection('skills')
  const openTask = useTaskEditor((s) => s.openCreate)
  const openCreate = useLearningEditor((s) => s.openCreate)
  const openEdit = useLearningEditor((s) => s.openEdit)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LearningItem['status'] | 'all'>('all')
  const [type, setType] = useState<LearningItem['type'] | 'all'>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const order = { learning: 0, to_learn: 1, paused: 2, completed: 3 }
    return items
      .filter((i) => (!q || i.title.toLowerCase().includes(q) || (i.notes ?? '').toLowerCase().includes(q)) && (status === 'all' || i.status === status) && (type === 'all' || i.type === type))
      .sort((a, b) => order[a.status] - order[b.status] || b.updatedAt.localeCompare(a.updatedAt))
      .map((item) => ({
        item,
        minutes: learningMinutes(item.id, entries, tasks),
        notes: notes.filter((n) => n.linkedLearningItemIds.includes(item.id)).length,
        sessions: tasks.filter((t) => t.learningItemId === item.id),
        skill: item.skillId ? skills.find((s) => s.id === item.skillId) : undefined,
      }))
  }, [items, entries, notes, tasks, skills, query, status, type])

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BookMarkedIcon}
        title="O‘quv resurslari yo‘q"
        description="Kurs, kitob, maqola yoki mavzuni qo‘shing. O‘rganishga sarflangan vaqt va amaliy natija shu yerda ko‘rinadi."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Resurs qo‘shish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SearchInput value={query} onChange={setQuery} placeholder="Resurslarni qidirish…" />
          <FilterSelect label="Holat" value={status} onChange={setStatus} options={withAll(enumOptions(LEARNING_STATUS_LABELS), 'Barcha holatlar')} />
          <FilterSelect label="Turi" value={type} onChange={setType} options={withAll(enumOptions(LEARNING_TYPE_LABELS), 'Barcha turlar')} />
        </div>
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Resurs
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState compact icon={SearchXIcon} title="Mos resurs topilmadi" description="Filtrlarni o‘zgartiring." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ item, minutes, notes: noteCount, sessions, skill }) => {
            const upcoming = sessions.filter(isOpen).sort((a, b) => (a.scheduledDate ?? a.dueDate ?? '9999').localeCompare(b.scheduledDate ?? b.dueDate ?? '9999'))
            const doneSessions = sessions.filter((t) => t.status === 'done').length
            return (
            <Card key={item.id} className="gap-2 px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button type="button" onClick={() => openEdit(item)} className="text-left font-medium hover:underline">
                    {item.title}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {LEARNING_TYPE_LABELS[item.type]}
                    {item.completedAt ? ` · tugatildi ${formatDate(item.completedAt, 'd MMM yyyy')}` : item.startedAt ? ` · boshlandi ${formatDate(item.startedAt, 'd MMM')}` : ''}
                    {skill && ` · ${skill.name}`}
                  </p>
                </div>
                <StatusBadge tone={STATUS_TONES[item.status]}>{LEARNING_STATUS_LABELS[item.status]}</StatusBadge>
              </div>
              {item.notes && <p className="line-clamp-2 text-sm text-muted-foreground">{item.notes}</p>}
              {item.outcome && <p className="text-xs"><span className="text-muted-foreground">Amaliy natija:</span> {item.outcome}</p>}
              <p className="tabular text-xs text-muted-foreground">
                Sarflangan vaqt: {formatMinutes(minutes)}
                {noteCount > 0 && ` · ${noteCount} ta qayd`}
                {doneSessions > 0 && ` · ${doneSessions} ta mashg‘ulot o‘tilgan`}
              </p>
              {upcoming.length > 0 && (
                <ul className="flex flex-col gap-1 rounded-md bg-muted/50 px-2.5 py-2 text-xs" aria-label="Rejalashtirilgan mashg‘ulotlar">
                  {upcoming.slice(0, 3).map((t) => (
                    <li key={t.id} className="flex justify-between gap-2">
                      <span className="truncate">{t.title}</span>
                      <span className="shrink-0 text-muted-foreground">{t.scheduledDate ? formatDateShort(t.scheduledDate) : t.weekStart ? 'shu haftada' : 'kunsiz'}</span>
                    </li>
                  ))}
                  {upcoming.length > 3 && <li className="text-muted-foreground">yana {upcoming.length - 3} ta</li>}
                </ul>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <NativeSelect
                  size="sm"
                  value={item.status}
                  onChange={(e) => learningService.setStatus(item.id, e.target.value as LearningItem['status'])}
                  aria-label={`“${item.title}” holati`}
                  className="[&_select]:h-7 [&_select]:text-xs"
                >
                  {LEARNING_STATUSES.map((s) => (
                    <NativeSelectOption key={s} value={s}>
                      {LEARNING_STATUS_LABELS[s]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {item.status !== 'completed' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openTask({ title: `${item.title}: mashg‘ulot`, learningItemId: item.id, lifeAreaId: item.lifeAreaId, goalId: item.goalId, estimatedMinutes: 45 })
                      }
                    >
                      <CalendarPlusIcon /> Mashg‘ulot
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => timerService.start({ learningItemId: item.id, lifeAreaId: item.lifeAreaId, note: item.title })}>
                      <PlayIcon /> Taymer
                    </Button>
                  </>
                )}
                {item.url && (
                  <Button size="icon-sm" variant="ghost" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`“${item.title}” manbasini yangi oynada ochish`}>
                      <ExternalLinkIcon />
                    </a>
                  </Button>
                )}
                <Button size="icon-sm" variant="ghost" aria-label="Tahrirlash" onClick={() => openEdit(item)}>
                  <PencilIcon />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="O‘chirish"
                  onClick={async () => {
                    if (await confirmDelete('Resurs', 'Resurs o‘chiriladi. Unga bog‘langan vaqt yozuvlari va qaydlar saqlanadi.')) learningService.remove(item.id)
                  }}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function EnglishPage() {
  const vocab = useCollection('vocab')
  const entries = useCollection('timeEntries')
  const today = useToday()
  const openCreate = useVocabEditor((s) => s.openCreate)
  const openEdit = useVocabEditor((s) => s.openEdit)
  const [minutes, setMinutes] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showLearned, setShowLearned] = useState(false)

  const practice = useMemo(() => entries.filter((e) => e.note?.startsWith(ENGLISH_PRACTICE_PREFIX)).sort((a, b) => b.date.localeCompare(a.date)), [entries])
  const week = startOfWeekKey(today)
  const weekMinutes = totalMinutes(entriesBetween(practice, week, endOfWeekKey(week)))
  const visible = vocab.filter((v) => showLearned || !v.learned).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const logPractice = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(minutes)
    if (!Number.isInteger(n) || n < 1 || n > 600) return setError('1 dan 600 gacha daqiqa kiriting')
    setError(null)
    const ok = timeEntryService.create({
      date: today,
      durationMinutes: n,
      lifeAreaId: 'area-learning',
      source: 'manual',
      note: `${ENGLISH_PRACTICE_PREFIX}: ${note.trim() || 'mashq'}`,
    })
    if (ok) {
      setMinutes('')
      setNote('')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard
        className="lg:col-span-2"
        title={<span className="inline-flex items-center gap-2"><LanguagesIcon className="size-4" aria-hidden="true" /> Iboralar va so‘zlar</span>}
        description={`${vocab.filter((v) => !v.learned).length} ta o‘rganilmoqda · ${vocab.filter((v) => v.learned).length} ta o‘zlashtirilgan`}
        action={
          <Button size="sm" onClick={() => openCreate()}>
            <PlusIcon /> Ibora
          </Button>
        }
      >
        {vocab.length === 0 ? (
          <p className="text-sm text-muted-foreground">Yangi uchragan ibora va so‘zlarni misol bilan yozib boring.</p>
        ) : (
          <>
            <label className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={showLearned} onCheckedChange={(c) => setShowLearned(c === true)} /> O‘zlashtirilganlarni ham ko‘rsatish
            </label>
            <ul className="divide-y">
              {visible.map((v) => (
                <li key={v.id} className="flex items-start gap-3 py-2.5">
                  <Checkbox
                    checked={v.learned}
                    onCheckedChange={(c) => vocabService.update(v.id, { learned: c === true })}
                    aria-label={`“${v.phrase}” o‘zlashtirildi`}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-medium', v.learned && 'text-muted-foreground')}>{v.phrase}</p>
                    {v.meaning && <p className="text-sm text-muted-foreground">{v.meaning}</p>}
                    {v.example && <p className="text-xs text-muted-foreground italic">“{v.example}”</p>}
                  </div>
                  <Button variant="ghost" size="icon-xs" aria-label="Tahrirlash" onClick={() => openEdit(v)}>
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="O‘chirish"
                    onClick={async () => {
                      if (await confirmDelete('Ibora')) vocabService.remove(v.id)
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>
      <SectionCard title="Mashq logi" description={`Shu hafta: ${formatMinutes(weekMinutes)}`}>
        <form onSubmit={logPractice} className="mb-4 flex flex-col gap-2" noValidate>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eng-min">Daqiqa</Label>
              <Input id="eng-min" type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-invalid={error ? true : undefined} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eng-note">Mashq turi</Label>
              <Input id="eng-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="podcast, speaking, o‘qish…" />
            </div>
          </div>
          {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
          <Button type="submit" variant="outline">
            <CheckIcon /> Qayd etish
          </Button>
        </form>
        {practice.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm">
            {practice.slice(0, 10).map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span className="truncate text-muted-foreground">
                  {formatDate(e.date, 'd MMM')} · {e.note?.replace(`${ENGLISH_PRACTICE_PREFIX}: `, '')}
                </span>
                <span className="tabular">{formatMinutes(e.durationMinutes)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Hali mashq qayd etilmagan.</p>
        )}
      </SectionCard>
    </div>
  )
}
