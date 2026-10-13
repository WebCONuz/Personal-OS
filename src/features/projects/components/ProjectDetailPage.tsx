import { ArrowLeftIcon, FootprintsIcon, PencilIcon, PlusIcon, TargetIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { MoneyTotals } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SectionCard } from '@/components/shared/SectionCard'
import { STATUS_TONES, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PROJECT_KIND_LABELS, PROJECT_STATUS_LABELS } from '@/constants/labels'
import { MilestoneList } from '@/features/goals/components/MilestoneList'
import { TaskItem } from '@/features/tasks/components/TaskItem'
import { useTaskEditor } from '@/features/tasks/editor'
import { useCollection } from '@/hooks/useData'
import { sortByPriority, totalMinutes } from '@/services/analytics'
import { formatDate, formatMinutes } from '@/services/date'
import { sumByCurrency } from '@/services/money'
import { taskCompletion } from '@/services/progress'
import { useProjectEditor } from '../editor'
import { projectService } from '../service'

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const projects = useCollection('projects')
  const goals = useCollection('goals')
  const tasks = useCollection('tasks')
  const timeEntries = useCollection('timeEntries')
  const transactions = useCollection('transactions')
  const openEdit = useProjectEditor((s) => s.openEdit)
  const openTask = useTaskEditor((s) => s.openCreate)
  const project = projects.find((p) => p.id === projectId)
  const [nextStep, setNextStep] = useState<string | null>(null)

  const projectTasks = useMemo(() => sortByPriority(tasks.filter((t) => t.projectId === projectId)), [tasks, projectId])
  const stats = taskCompletion(projectTasks)
  const minutes = useMemo(() => {
    const taskIds = new Set(projectTasks.map((t) => t.id))
    return totalMinutes(timeEntries.filter((e) => e.projectId === projectId || (e.taskId && taskIds.has(e.taskId))))
  }, [timeEntries, projectTasks, projectId])
  const money = useMemo(() => {
    const list = transactions.filter((t) => t.projectId === projectId)
    return {
      income: sumByCurrency(list.filter((t) => t.type === 'income')),
      expense: sumByCurrency(list.filter((t) => t.type === 'expense')),
      count: list.length,
    }
  }, [transactions, projectId])

  if (!project) {
    return (
      <EmptyState
        title="Loyiha topilmadi"
        description="U o‘chirilgan bo‘lishi mumkin."
        action={
          <Button asChild variant="outline">
            <Link to="/business">Loyihalarga qaytish</Link>
          </Button>
        }
      />
    )
  }

  const goal = project.goalId ? goals.find((g) => g.id === project.goalId) : undefined
  const editingNext = nextStep !== null

  const saveNext = (e: FormEvent) => {
    e.preventDefault()
    if (projectService.update(project.id, { nextStep: nextStep?.trim() || undefined }, 'Keyingi qadam saqlandi')) setNextStep(null)
  }

  const remove = async () => {
    const ok = await confirmDelete('Loyiha', 'Loyiha va uning bosqichlari o‘chiriladi. Vazifalar, vaqt yozuvlari va tranzaksiyalar saqlanadi, lekin loyihadan ajratiladi.')
    if (ok && projectService.remove(project.id)) navigate('/business')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to={project.kind === 'research' ? '/learning/research' : '/business'}>
            <ArrowLeftIcon /> {project.kind === 'research' ? 'Ilmiy ish' : 'Loyihalar'}
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">{project.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <StatusBadge tone={STATUS_TONES[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</StatusBadge>
              <span>{PROJECT_KIND_LABELS[project.kind]}</span>
              <LifeAreaBadge areaId={project.lifeAreaId} />
              {project.targetDate && <span>Muddat: {formatDate(project.targetDate, 'd MMM yyyy')}</span>}
              {goal && (
                <Link to={`/goals/${goal.id}`} className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
                  <TargetIcon className="size-3.5" aria-hidden="true" /> {goal.title}
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openEdit(project)}>
              <PencilIcon /> Tahrirlash
            </Button>
            <Button variant="outline" size="icon" aria-label="Loyihani o‘chirish" onClick={remove}>
              <Trash2Icon />
            </Button>
          </div>
        </div>
      </div>

      <SectionCard title={<span className="inline-flex items-center gap-2"><FootprintsIcon className="size-4" aria-hidden="true" /> Keyingi eng kichik qadam</span>}>
        {editingNext ? (
          <form onSubmit={saveNext} className="flex flex-col gap-2 sm:flex-row">
            <Input value={nextStep} onChange={(e) => setNextStep(e.target.value)} aria-label="Keyingi qadam" autoFocus placeholder="30 daqiqada bajarsa bo‘ladigan aniq harakat" />
            <div className="flex gap-2">
              <Button type="submit">Saqlash</Button>
              <Button type="button" variant="outline" onClick={() => setNextStep(null)}>
                Bekor qilish
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className={project.nextStep ? 'text-sm' : 'text-sm text-muted-foreground'}>{project.nextStep ?? 'Belgilanmagan. Loyihani harakatga keltiradigan bitta kichik qadamni yozing.'}</p>
            <Button size="sm" variant="outline" onClick={() => setNextStep(project.nextStep ?? '')}>
              {project.nextStep ? 'O‘zgartirish' : 'Belgilash'}
            </Button>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {project.description && (
            <SectionCard title="Tavsif">
              <p className="text-sm whitespace-pre-line text-muted-foreground">{project.description}</p>
            </SectionCard>
          )}
          <SectionCard
            title="Vazifalar"
            description={stats.total > 0 ? `${stats.done} / ${stats.total} bajarilgan` : undefined}
            action={
              <Button size="sm" variant="outline" onClick={() => openTask({ projectId: project.id, goalId: project.goalId, lifeAreaId: project.lifeAreaId })}>
                <PlusIcon /> Vazifa
              </Button>
            }
          >
            {stats.total > 0 && <ProgressBar value={stats.percent} label="Loyiha progressi" className="mb-4" />}
            {projectTasks.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {projectTasks.map((t) => (
                  <li key={t.id}>
                    <TaskItem task={t} hideLinks />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Loyiha progressi vazifalar asosida hisoblanadi. Birinchi vazifani qo‘shing.</p>
            )}
          </SectionCard>
        </div>
        <div className="flex flex-col gap-6">
          <SectionCard title="Bosqichlar">
            <MilestoneList projectId={project.id} />
          </SectionCard>
          <SectionCard title="Ko‘rsatkichlar">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Sarflangan vaqt</dt>
                <dd className="tabular font-medium">{formatMinutes(minutes)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tranzaksiyalar</dt>
                <dd className="tabular font-medium">{money.count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tushum</dt>
                <dd className="font-medium">
                  <MoneyTotals totals={money.income} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Xarajat</dt>
                <dd className="font-medium">
                  <MoneyTotals totals={money.expense} />
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
