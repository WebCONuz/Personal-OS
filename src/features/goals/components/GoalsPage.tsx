import { LayoutGridIcon, ListIcon, PlusIcon, SearchXIcon, TargetIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterSelect, enumOptions, withAll } from '@/components/shared/FilterSelect'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { STATUS_TONES, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GOAL_STATUS_LABELS } from '@/constants/labels'
import { useLifeAreas, useToday } from '@/hooks/useData'
import { formatDate, monthKeyOf } from '@/services/date'
import type { GoalStatus } from '@/types'
import { useGoalEditor } from '../editor'
import { useGoalSummaries } from '../hooks'
import { GoalCard } from './GoalCard'

type StatusFilter = GoalStatus | 'all' | 'open'
type DeadlineFilter = 'all' | 'overdue' | 'this-month' | 'none'

export function GoalsPage() {
  const summaries = useGoalSummaries()
  const areas = useLifeAreas()
  const today = useToday()
  const openCreate = useGoalEditor((s) => s.openCreate)
  const [view, setView] = useState<'cards' | 'list'>('cards')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('open')
  const [area, setArea] = useState('all')
  const [deadline, setDeadline] = useState<DeadlineFilter>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return summaries
      .filter(({ goal, overdue }) => {
        if (q && !goal.title.toLowerCase().includes(q) && !goal.description.toLowerCase().includes(q)) return false
        if (status === 'open' && !['planned', 'active', 'paused'].includes(goal.status)) return false
        if (status !== 'open' && status !== 'all' && goal.status !== status) return false
        if (area !== 'all' && goal.lifeAreaId !== area) return false
        if (deadline === 'overdue' && !overdue) return false
        if (deadline === 'this-month' && (!goal.targetDate || monthKeyOf(goal.targetDate) !== monthKeyOf(today))) return false
        if (deadline === 'none' && goal.targetDate) return false
        return true
      })
      .sort((a, b) => {
        const order = { active: 0, planned: 1, paused: 2, completed: 3, cancelled: 4 }
        return order[a.goal.status] - order[b.goal.status] || (a.goal.targetDate ?? '9999').localeCompare(b.goal.targetDate ?? '9999')
      })
  }, [summaries, query, status, area, deadline, today])

  const hasGoals = summaries.length > 0
  const clearFilters = () => {
    setQuery('')
    setStatus('all')
    setArea('all')
    setDeadline('all')
  }

  return (
    <div>
      <PageHeader
        title="Maqsadlar"
        description="Muhim yo‘nalishlar va ularning real progressi."
        actions={
          <Button onClick={() => openCreate()}>
            <PlusIcon /> Maqsad
          </Button>
        }
      />

      {!hasGoals ? (
        <EmptyState
          icon={TargetIcon}
          title="Hali maqsad qo‘shilmagan"
          description="3–5 ta eng muhim maqsaddan boshlang: karyera, moliya, ta’lim yoki oila. Keyin ularni haftalik vazifalarga ajratasiz."
          action={
            <Button onClick={() => openCreate()}>
              <PlusIcon /> Birinchi maqsadni yaratish
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <SearchInput value={query} onChange={setQuery} placeholder="Maqsadlarni qidirish…" />
              <FilterSelect
                label="Holat"
                value={status}
                onChange={setStatus}
                options={[{ value: 'open', label: 'Ochiq maqsadlar' }, ...withAll(enumOptions(GOAL_STATUS_LABELS), 'Barcha holatlar')]}
              />
              <FilterSelect
                label="Hayot sohasi"
                value={area}
                onChange={setArea}
                options={[{ value: 'all', label: 'Barcha sohalar' }, ...areas.map((a) => ({ value: a.id, label: a.name }))]}
              />
              <FilterSelect
                label="Muddat"
                value={deadline}
                onChange={setDeadline}
                options={[
                  { value: 'all', label: 'Har qanday muddat' },
                  { value: 'overdue', label: 'Muddati o‘tgan' },
                  { value: 'this-month', label: 'Shu oy' },
                  { value: 'none', label: 'Muddatsiz' },
                ]}
              />
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              value={view}
              onValueChange={(v) => v && setView(v as 'cards' | 'list')}
              aria-label="Ko‘rinish"
            >
              <ToggleGroupItem value="cards" aria-label="Kartalar">
                <LayoutGridIcon />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Ro‘yxat">
                <ListIcon />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchXIcon}
              title="Mos maqsad topilmadi"
              description="Filtrlarni o‘zgartiring yoki tozalang."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Filtrlarni tozalash
                </Button>
              }
            />
          ) : view === 'cards' ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <GoalCard key={s.goal.id} summary={s} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <ul className="divide-y">
                {filtered.map((s) => (
                  <li key={s.goal.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_180px_120px] sm:items-center">
                    <div className="min-w-0">
                      <Link to={`/goals/${s.goal.id}`} className="font-medium hover:underline">
                        {s.goal.title}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <LifeAreaBadge areaId={s.goal.lifeAreaId} />
                        {s.goal.targetDate && <span>{formatDate(s.goal.targetDate, 'd MMM yyyy')}</span>}
                      </div>
                    </div>
                    <ProgressBar value={s.progress} label={`${s.goal.title} progressi`} size="sm" />
                    <StatusBadge tone={STATUS_TONES[s.goal.status]} className="sm:justify-self-end">
                      {GOAL_STATUS_LABELS[s.goal.status]}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
