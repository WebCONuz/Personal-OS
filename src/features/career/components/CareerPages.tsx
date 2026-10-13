import { AwardIcon, BookPlusIcon, BriefcaseIcon, CompassIcon, DumbbellIcon, ExternalLinkIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, SparklesIcon, Trash2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { ACHIEVEMENT_TYPE_LABELS, JOB_STATUS_LABELS, LEARNING_STATUS_LABELS } from '@/constants/labels'
import { useLearningEditor } from '@/features/learning/editor'
import { learningMinutes } from '@/services/analytics'
import { formatMinutes } from '@/services/date'
import { JOB_STATUSES } from '@/data/schema/entities'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { diffDays, formatDate, relativeDayLabel } from '@/services/date'
import type { JobApplication, Skill } from '@/types'
import { useAchievementEditor, useJobEditor, useSkillEditor } from '../editor'
import { achievementService, jobService, skillService } from '../service'

function LevelDots({ value, target, label }: { value: number; target?: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${label}: ${value} / 5${target ? `, maqsad ${target}` : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            'size-2.5 rounded-full border',
            n <= value ? 'border-primary bg-primary' : target && n <= target ? 'border-primary/60 bg-transparent' : 'border-border bg-muted',
          )}
        />
      ))}
    </span>
  )
}

// ---------- Skills matrix ----------

export function SkillsPage() {
  const skills = useCollection('skills')
  const today = useToday()
  const openCreate = useSkillEditor((s) => s.openCreate)
  const openEdit = useSkillEditor((s) => s.openEdit)
  const grouped = useMemo(() => {
    const map = new Map<string, Skill[]>()
    for (const s of [...skills].sort((a, b) => a.name.localeCompare(b.name))) map.set(s.category, [...(map.get(s.category) ?? []), s])
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [skills])

  if (skills.length === 0) {
    return (
      <EmptyState
        icon={SparklesIcon}
        title="Ko‘nikmalar matritsasi bo‘sh"
        description="Asosiy texnik va soft ko‘nikmalaringizni qo‘shing, o‘zingizni 1–5 shkalada baholang va maqsad darajani belgilang."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Ko‘nikma qo‘shish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">To‘ldirilgan nuqta — hozirgi daraja, chiziqli nuqta — maqsad daraja.</p>
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Ko‘nikma
        </Button>
      </div>
      {grouped.map(([category, list]) => (
        <section key={category} aria-labelledby={`cat-${category}`} className="overflow-hidden rounded-xl border bg-card">
          <h2 id={`cat-${category}`} className="border-b bg-muted/40 px-4 py-2 text-sm font-semibold">
            {category}
          </h2>
          <ul className="divide-y">
            {list.map((s) => {
              const stale = s.lastPracticedAt ? diffDays(today, s.lastPracticedAt) > 30 : false
              const gap = s.targetLevel ? s.targetLevel - s.currentLevel : 0
              return (
                <li key={s.id} className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1fr)_auto] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <button type="button" onClick={() => openEdit(s)} className="font-medium hover:underline">
                      {s.name}
                    </button>
                    {s.learningPlan && <p className="truncate text-xs text-muted-foreground">Reja: {s.learningPlan}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <LevelDots value={s.currentLevel} target={s.targetLevel} label={s.name} />
                    {gap > 0 && <span className="text-xs text-muted-foreground">+{gap} daraja</span>}
                  </div>
                  <p className={cn('text-xs text-muted-foreground', stale && 'text-warning-foreground')}>
                    {s.lastPracticedAt ? `Oxirgi mashq: ${relativeDayLabel(s.lastPracticedAt, today)}` : 'Mashq qayd etilmagan'}
                  </p>
                  <div className="flex gap-1 md:justify-end">
                    <Button size="sm" variant="outline" onClick={() => skillService.markPracticed(s.id)} disabled={s.lastPracticedAt === today}>
                      <DumbbellIcon /> Bugun mashq qildim
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`${s.name} ko‘nikmasini o‘chirish`}
                      onClick={async () => {
                        if (await confirmDelete('Ko‘nikma')) skillService.remove(s.id)
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

// ---------- Achievements timeline ----------

export function AchievementsPage() {
  const achievements = useCollection('achievements')
  const skills = useCollection('skills')
  const openCreate = useAchievementEditor((s) => s.openCreate)
  const openEdit = useAchievementEditor((s) => s.openEdit)
  const byYear = useMemo(() => {
    const sorted = [...achievements].sort((a, b) => b.date.localeCompare(a.date))
    const map = new Map<string, typeof sorted>()
    for (const a of sorted) map.set(a.date.slice(0, 4), [...(map.get(a.date.slice(0, 4)) ?? []), a])
    return [...map.entries()]
  }, [achievements])

  if (achievements.length === 0) {
    return (
      <EmptyState
        icon={AwardIcon}
        title="Yutuqlar jurnali bo‘sh"
        description="Faqat o‘qilgan soatlar emas, ko‘rinadigan natijalarni qayd eting: loyiha, kod, maqola, chiqish. Bu CV va intervyu uchun tayyor material."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Yutuq qo‘shish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Yutuq
        </Button>
      </div>
      {byYear.map(([year, list]) => (
        <section key={year} aria-labelledby={`y-${year}`}>
          <h2 id={`y-${year}`} className="mb-3 text-sm font-semibold text-muted-foreground">
            {year}
          </h2>
          <ol className="relative flex flex-col gap-4 border-l pl-6">
            {list.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(a.date, 'd MMMM')} · {ACHIEVEMENT_TYPE_LABELS[a.type]}
                    </p>
                    <p className="font-medium">{a.title}</p>
                    {a.description && <p className="mt-0.5 text-sm text-muted-foreground">{a.description}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {a.skillIds.map((id) => {
                        const s = skills.find((x) => x.id === id)
                        return s ? <StatusBadge key={id} tone="muted">{s.name}</StatusBadge> : null
                      })}
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          Havola <ExternalLinkIcon className="size-3" aria-hidden="true" />
                          <span className="sr-only">(yangi oynada)</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    <Button variant="ghost" size="icon-sm" aria-label="Tahrirlash" onClick={() => openEdit(a)}>
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="O‘chirish"
                      onClick={async () => {
                        if (await confirmDelete('Yutuq')) achievementService.remove(a.id)
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

// ---------- Job pipeline ----------

const PIPELINE: Array<JobApplication['status']> = ['wishlist', 'applied', 'interview', 'offer']
const JOB_TONES: Record<JobApplication['status'], Tone> = {
  wishlist: 'muted',
  applied: 'primary',
  interview: 'primary',
  offer: 'success',
  rejected: 'muted',
  withdrawn: 'muted',
}

function JobCard({ job }: { job: JobApplication }) {
  const openEdit = useJobEditor((s) => s.openEdit)
  return (
    <Card className="gap-2 px-3 py-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => openEdit(job)} className="min-w-0 text-left hover:underline">
          <span className="block truncate font-medium">{job.role}</span>
          <span className="block truncate text-xs text-muted-foreground">{job.company}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`${job.company} amallari`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openEdit(job)}>
              <PencilIcon /> Tahrirlash
            </DropdownMenuItem>
            {job.url && (
              <DropdownMenuItem asChild>
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon /> Vakansiyani ochish
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={async () => {
                if (await confirmDelete('Ariza')) jobService.remove(job.id)
              }}
            >
              <Trash2Icon /> O‘chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {job.nextAction && <p className="text-xs">Keyingi qadam: {job.nextAction}</p>}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{job.appliedAt ? formatDate(job.appliedAt, 'd MMM') : ''}</span>
        <NativeSelect
          size="sm"
          value={job.status}
          onChange={(e) => jobService.setStatus(job, e.target.value as JobApplication['status'])}
          aria-label={`${job.company} holati`}
          className="[&_select]:h-6 [&_select]:text-xs"
        >
          {JOB_STATUSES.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </Card>
  )
}

export function JobsPage() {
  const jobs = useCollection('jobApplications')
  const openCreate = useJobEditor((s) => s.openCreate)
  const closed = jobs.filter((j) => j.status === 'rejected' || j.status === 'withdrawn')

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={BriefcaseIcon}
        title="Ish imkoniyatlari ro‘yxati bo‘sh"
        description="Qiziqarli vakansiyalarni saqlang va har birining keyingi qadamini belgilang. Bu shaxsiy ro‘yxat — ilova ish saytlariga ulanmaydi."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Imkoniyat qo‘shish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Imkoniyat
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PIPELINE.map((status) => {
          const list = jobs.filter((j) => j.status === status)
          return (
            <section key={status} aria-label={JOB_STATUS_LABELS[status]} className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-2.5">
              <header className="flex items-center justify-between px-0.5">
                <StatusBadge tone={JOB_TONES[status]}>{JOB_STATUS_LABELS[status]}</StatusBadge>
                <span className="tabular text-xs text-muted-foreground">{list.length}</span>
              </header>
              {list.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
              {list.length === 0 && <p className="px-0.5 py-2 text-xs text-muted-foreground">Bo‘sh</p>}
            </section>
          )
        })}
      </div>
      {closed.length > 0 && (
        <details className="rounded-xl border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Yopilgan arizalar ({closed.length})</summary>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {closed.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ---------- Learning directions ----------

/**
 * Skills with a gap between current and target level, each with its learning plan, linked resources
 * (Ta’lim → resource “Rivojlantiradigan ko‘nikma”), time invested and visible evidence.
 */
export function LearningDirectionsPage() {
  const skills = useCollection('skills')
  const items = useCollection('learningItems')
  const entries = useCollection('timeEntries')
  const tasks = useCollection('tasks')
  const achievements = useCollection('achievements')
  const today = useToday()
  const openSkill = useSkillEditor((s) => s.openEdit)
  const createSkill = useSkillEditor((s) => s.openCreate)
  const openLearning = useLearningEditor((s) => s.openCreate)

  const directions = useMemo(
    () =>
      skills
        .filter((s) => (s.targetLevel ?? 0) > s.currentLevel || items.some((i) => i.skillId === s.id))
        .map((skill) => {
          const resources = items.filter((i) => i.skillId === skill.id)
          return {
            skill,
            gap: Math.max(0, (skill.targetLevel ?? skill.currentLevel) - skill.currentLevel),
            resources,
            minutes: resources.reduce((sum, r) => sum + learningMinutes(r.id, entries, tasks), 0),
            evidence: achievements.filter((a) => a.skillIds.includes(skill.id)).length,
          }
        })
        .sort((a, b) => b.gap - a.gap || a.skill.name.localeCompare(b.skill.name)),
    [skills, items, entries, tasks, achievements],
  )
  const withoutTarget = skills.filter((s) => !s.targetLevel && !items.some((i) => i.skillId === s.id))

  if (directions.length === 0) {
    return (
      <EmptyState
        icon={CompassIcon}
        title="O‘rganish yo‘nalishlari hali yo‘q"
        description={
          skills.length
            ? 'Ko‘nikmalarga maqsad daraja belgilang — hozirgi va maqsad daraja orasidagi farq o‘rganish yo‘nalishiga aylanadi.'
            : 'Avval ko‘nikmalarni qo‘shing va har biriga maqsad daraja belgilang.'
        }
        action={<Button onClick={() => createSkill()}><PlusIcon /> Ko‘nikma qo‘shish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Eng katta farqdan boshlab saralangan. Resurslar Ta’lim bo‘limida ko‘nikmaga bog‘lanadi.</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {directions.map(({ skill, gap, resources, minutes, evidence }) => (
          <Card key={skill.id} className="gap-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{skill.name}</p>
                <p className="text-xs text-muted-foreground">
                  {skill.category}
                  {skill.lastPracticedAt ? ` · oxirgi mashq ${relativeDayLabel(skill.lastPracticedAt, today).toLowerCase()}` : ' · mashq qayd etilmagan'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <LevelDots value={skill.currentLevel} target={skill.targetLevel} label={skill.name} />
                <span className="text-xs text-muted-foreground">{gap > 0 ? `${skill.currentLevel} → ${skill.targetLevel} (+${gap})` : 'Maqsadga yetilgan'}</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-xs font-medium text-muted-foreground">O‘rganish rejasi</p>
              <p className={cn(!skill.learningPlan && 'text-muted-foreground')}>{skill.learningPlan ?? 'Reja yozilmagan.'}</p>
            </div>
            {resources.length > 0 ? (
              <ul className="flex flex-col gap-1 text-sm" aria-label={`${skill.name} uchun resurslar`}>
                {resources.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{r.title}</span>
                    <StatusBadge tone={r.status === 'completed' ? 'success' : r.status === 'learning' ? 'primary' : 'muted'}>{LEARNING_STATUS_LABELS[r.status]}</StatusBadge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Bog‘langan o‘quv resursi yo‘q.</p>
            )}
            <p className="tabular text-xs text-muted-foreground">
              Sarflangan vaqt: {formatMinutes(minutes)} · Amaliy dalillar: {evidence} ta
            </p>
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button size="sm" variant="outline" onClick={() => openLearning({ skillId: skill.id, lifeAreaId: 'area-learning' })}>
                <BookPlusIcon /> Resurs qo‘shish
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openSkill(skill)}>
                <PencilIcon /> Rejani tahrirlash
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {withoutTarget.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Maqsad daraja belgilanmagan ko‘nikmalar: {withoutTarget.map((s) => s.name).join(', ')}.
        </p>
      )}
    </div>
  )
}
