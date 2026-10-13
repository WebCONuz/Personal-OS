import { FolderKanbanIcon, FootprintsIcon, InfoIcon, PlusIcon, SearchXIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterSelect, enumOptions, withAll } from '@/components/shared/FilterSelect'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { STATUS_TONES, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PROJECT_KIND_LABELS, PROJECT_STATUS_LABELS } from '@/constants/labels'
import { useCollection } from '@/hooks/useData'
import { formatDate } from '@/services/date'
import { taskCompletion } from '@/services/progress'
import type { Project } from '@/types'
import { useProjectEditor } from '../editor'
import { PARALLEL_PROJECT_SOFT_LIMIT } from '../service'

type StatusFilter = Project['status'] | 'all' | 'open'

export function ProjectsPage({ kind: fixedKind }: { kind?: Project['kind'] }) {
  const projects = useCollection('projects')
  const tasks = useCollection('tasks')
  const openCreate = useProjectEditor((s) => s.openCreate)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('open')
  const [kind, setKind] = useState<Project['kind'] | 'all'>(fixedKind ?? 'all')

  const activeCount = projects.filter((p) => p.status === 'active').length

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects
      .filter((p) => {
        if (q && !p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false
        if (status === 'open' && !['planned', 'active', 'paused'].includes(p.status)) return false
        if (status !== 'open' && status !== 'all' && p.status !== status) return false
        if (kind !== 'all' && p.kind !== kind) return false
        return true
      })
      .map((p) => ({ project: p, stats: taskCompletion(tasks.filter((t) => t.projectId === p.id)) }))
      .sort((a, b) => {
        const order = { active: 0, planned: 1, paused: 2, completed: 3, cancelled: 4 }
        return order[a.project.status] - order[b.project.status] || b.project.updatedAt.localeCompare(a.project.updatedAt)
      })
  }, [projects, tasks, query, status, kind])

  const create = () => openCreate(fixedKind ? { kind: fixedKind, lifeAreaId: fixedKind === 'research' ? 'area-learning' : undefined } : {})

  if (projects.filter((p) => !fixedKind || p.kind === fixedKind).length === 0) {
    return (
      <EmptyState
        icon={FolderKanbanIcon}
        title={fixedKind === 'research' ? 'Ilmiy ish loyihasi yo‘q' : 'Loyihalar hali yo‘q'}
        description={
          fixedKind === 'research'
            ? 'Magistratura yoki ilmiy izlanishni loyiha sifatida yarating va bosqichlarga ajrating: adabiyot tahlili, tajriba, maqola.'
            : 'Biznes, portfolio, ilmiy ish yoki shaxsiy tashabbusni loyiha sifatida yarating. Progress vazifalar asosida hisoblanadi.'
        }
        action={
          <Button onClick={create}>
            <PlusIcon /> Loyiha yaratish
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {activeCount > PARALLEL_PROJECT_SOFT_LIMIT && !fixedKind && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm" role="status">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p>
            Hozir <strong>{activeCount} ta</strong> loyiha faol. Cheklangan vaqtda {PARALLEL_PROJECT_SOFT_LIMIT} tadan ko‘p parallel loyiha odatda
            har birini sekinlashtiradi. Ayrimlarini “To‘xtatilgan” holatiga o‘tkazishni ko‘rib chiqing.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SearchInput value={query} onChange={setQuery} placeholder="Loyihalarni qidirish…" />
          <FilterSelect
            label="Holat"
            value={status}
            onChange={setStatus}
            options={[{ value: 'open', label: 'Ochiq loyihalar' }, ...withAll(enumOptions(PROJECT_STATUS_LABELS), 'Barcha holatlar')]}
          />
          {!fixedKind && (
            <FilterSelect label="Turi" value={kind} onChange={setKind} options={withAll(enumOptions(PROJECT_KIND_LABELS), 'Barcha turlar')} />
          )}
        </div>
        <Button onClick={create}>
          <PlusIcon /> Loyiha
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={SearchXIcon} title="Mos loyiha topilmadi" description="Qidiruv yoki filtrlarni o‘zgartiring." compact />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ project: p, stats }) => (
            <Card key={p.id} className="relative gap-3 px-4 py-4 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/business/projects/${p.id}`} className="font-medium after:absolute after:inset-0 hover:underline">
                    {p.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{PROJECT_KIND_LABELS[p.kind]}</span>
                    <LifeAreaBadge areaId={p.lifeAreaId} />
                    {p.targetDate && <span>Muddat: {formatDate(p.targetDate, 'd MMM yyyy')}</span>}
                  </div>
                </div>
                <StatusBadge tone={STATUS_TONES[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</StatusBadge>
              </div>
              {stats.total > 0 ? (
                <div>
                  <ProgressBar value={stats.percent} size="sm" label={`${p.title} progressi`} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.done} / {stats.total} vazifa
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Vazifalar qo‘shilmagan</p>
              )}
              {p.nextStep && (
                <p className="flex items-start gap-1.5 border-t pt-3 text-xs">
                  <FootprintsIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>
                    <span className="text-muted-foreground">Keyingi qadam: </span>
                    {p.nextStep}
                  </span>
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
