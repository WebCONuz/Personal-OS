import { InboxIcon, ListTodoIcon, PlusIcon, SearchXIcon } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterSelect, enumOptions, withAll } from '@/components/shared/FilterSelect'
import { SearchInput } from '@/components/shared/SearchInput'
import { ViewSwitcher } from '@/components/shared/SectionTabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TASK_PRIORITY_LABELS } from '@/constants/labels'
import { useCollection, useLifeAreas, useToday } from '@/hooks/useData'
import { isInbox, isOpen, isOverdue, isUnplanned, sortByPriority, tasksForDay } from '@/services/analytics'
import type { Task, TaskPriority } from '@/types'
import { useTaskEditor } from '../editor'
import { taskService } from '../service'
import { TaskItem } from './TaskItem'

type View = 'open' | 'today' | 'inbox' | 'unplanned' | 'overdue' | 'done' | 'all'
type Sort = 'priority' | 'due' | 'created'

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'open', label: 'Faol' },
  { value: 'today', label: 'Bugun' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'unplanned', label: 'Rejalashtirilmagan' },
  { value: 'overdue', label: 'Muddati o‘tgan' },
  { value: 'done', label: 'Bajarilgan' },
  { value: 'all', label: 'Barchasi' },
]

export function TasksPage() {
  const tasks = useCollection('tasks')
  const areas = useLifeAreas()
  const today = useToday()
  const openCreate = useTaskEditor((s) => s.openCreate)
  const [params, setParams] = useSearchParams()
  const view = (VIEWS.find((v) => v.value === params.get('view'))?.value ?? 'open') as View
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('all')
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')
  const [sort, setSort] = useState<Sort>('priority')
  const [capture, setCapture] = useState('')

  const counts = useMemo(
    () => ({
      open: tasks.filter(isOpen).length,
      today: tasksForDay(tasks, today).filter(isOpen).length,
      inbox: tasks.filter(isInbox).length,
      unplanned: tasks.filter(isUnplanned).length,
      overdue: tasks.filter((t) => isOverdue(t, today)).length,
      done: tasks.filter((t) => t.status === 'done').length,
      all: tasks.length,
    }),
    [tasks, today],
  )

  const filtered = useMemo(() => {
    let list: Task[]
    switch (view) {
      case 'open':
        list = tasks.filter(isOpen)
        break
      case 'today':
        list = tasksForDay(tasks, today)
        break
      case 'inbox':
        list = tasks.filter(isInbox)
        break
      case 'unplanned':
        list = tasks.filter(isUnplanned)
        break
      case 'overdue':
        list = tasks.filter((t) => isOverdue(t, today))
        break
      case 'done':
        list = tasks.filter((t) => t.status === 'done')
        break
      default:
        list = [...tasks]
    }
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    if (area !== 'all') list = list.filter((t) => (area === 'none' ? !t.lifeAreaId : t.lifeAreaId === area))
    if (priority !== 'all') list = list.filter((t) => t.priority === priority)
    if (sort === 'priority') return sortByPriority(list)
    if (sort === 'due') return [...list].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [tasks, view, today, query, area, priority, sort])

  const submitCapture = (e: FormEvent) => {
    e.preventDefault()
    if (!capture.trim()) return
    if (taskService.quickCapture(capture)) setCapture('')
  }

  const hasFilters = query !== '' || area !== 'all' || priority !== 'all'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ViewSwitcher
          label="Vazifalar ko‘rinishi"
          value={view}
          onChange={(v) => setParams(v === 'open' ? {} : { view: v }, { replace: true })}
          options={VIEWS.map((v) => ({ ...v, count: counts[v.value] }))}
        />
        <Button onClick={() => openCreate(view === 'today' ? { scheduledDate: today } : {})}>
          <PlusIcon /> Vazifa
        </Button>
      </div>

      <form onSubmit={submitCapture} className="flex gap-2" aria-label="Inbox’ga tez yozib qo‘yish">
        <Input
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          placeholder="Tez yozib qo‘yish: fikr yoki vazifa… (Enter)"
          aria-label="Inbox’ga yangi vazifa"
        />
        <Button type="submit" variant="outline" disabled={!capture.trim()}>
          <InboxIcon /> Inbox’ga
        </Button>
      </form>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchInput value={query} onChange={setQuery} placeholder="Vazifalarni qidirish…" />
        <FilterSelect
          label="Hayot sohasi"
          value={area}
          onChange={setArea}
          options={[{ value: 'all', label: 'Barcha sohalar' }, { value: 'none', label: 'Sohasiz' }, ...areas.map((a) => ({ value: a.id, label: a.name }))]}
        />
        <FilterSelect
          label="Ustuvorlik"
          value={priority}
          onChange={setPriority}
          options={withAll(enumOptions(TASK_PRIORITY_LABELS), 'Barcha ustuvorliklar')}
        />
        <FilterSelect
          label="Saralash"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'priority', label: 'Ustuvorlik bo‘yicha' },
            { value: 'due', label: 'Muddat bo‘yicha' },
            { value: 'created', label: 'Yangilari avval' },
          ]}
        />
      </div>

      {filtered.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="Vazifalar ro‘yxati">
          {filtered.map((task) => (
            <li key={task.id}>
              <TaskItem task={task} />
            </li>
          ))}
        </ul>
      ) : hasFilters ? (
        <EmptyState
          icon={SearchXIcon}
          title="Mos vazifa topilmadi"
          description="Qidiruv so‘zini yoki filtrlarni o‘zgartirib ko‘ring."
          action={
            <Button variant="outline" onClick={() => { setQuery(''); setArea('all'); setPriority('all') }}>
              Filtrlarni tozalash
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={view === 'inbox' ? InboxIcon : ListTodoIcon}
          title={emptyTitle(view)}
          description={emptyDescription(view)}
          action={
            view !== 'done' && view !== 'overdue' ? (
              <Button onClick={() => openCreate(view === 'today' ? { scheduledDate: today } : {})}>
                <PlusIcon /> Vazifa qo‘shish
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  )
}

function emptyTitle(view: View): string {
  switch (view) {
    case 'today':
      return 'Bugunga vazifa belgilanmagan'
    case 'inbox':
      return 'Inbox bo‘sh'
    case 'unplanned':
      return 'Barcha ochiq vazifalar rejalashtirilgan'
    case 'overdue':
      return 'Muddati o‘tgan vazifa yo‘q'
    case 'done':
      return 'Hali bajarilgan vazifa yo‘q'
    default:
      return 'Vazifalar yo‘q'
  }
}

function emptyDescription(view: View): string {
  switch (view) {
    case 'today':
      return 'Haftalik rejadagi vazifalardan birini bugunga belgilang yoki yangisini qo‘shing.'
    case 'inbox':
      return 'Yuqoridagi maydonga tez yozib qo‘ying — keyin haftalik rejaga taqsimlaysiz.'
    case 'unplanned':
      return 'Hech qaysi haftaga yoki kunga kiritilmagan ochiq vazifa qolmadi.'
    case 'overdue':
      return 'Hammasi o‘z vaqtida. Shunday davom eting.'
    case 'done':
      return 'Vazifani bajarilgan deb belgilaganingizda shu yerda ko‘rinadi.'
    default:
      return 'Birinchi vazifani qo‘shing yoki maqsadlaringizni kichik qadamlarga ajrating.'
  }
}
