import { ArrowRightIcon, FolderIcon, LightbulbIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { confirm, confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { CONTACT_STAGE_LABELS, IDEA_STATUS_LABELS } from '@/constants/labels'
import { CONTACT_STAGES, IDEA_STATUSES } from '@/data/schema/entities'
import { useCollection } from '@/hooks/useData'
import type { Contact, Idea } from '@/types'
import { useContactEditor, useIdeaEditor } from '../editor'
import { contactService, ideaScore, ideaService } from '../service'

const BOARD: Array<Idea['status']> = ['inbox', 'researching', 'validated', 'building', 'launched']

function IdeaCard({ idea }: { idea: Idea }) {
  const openEdit = useIdeaEditor((s) => s.openEdit)
  const projects = useCollection('projects')
  const navigate = useNavigate()
  const score = ideaScore(idea)
  const project = idea.projectId ? projects.find((p) => p.id === idea.projectId) : undefined

  const convert = async () => {
    const ok = await confirm({
      title: 'G‘oyani loyihaga aylantirish?',
      description: 'Yangi biznes loyihasi “Rejada” holatida yaratiladi va g‘oyaga bog‘lanadi. Har bir g‘oyani darhol loyihaga aylantirish shart emas.',
      confirmLabel: 'Loyiha yaratish',
    })
    if (!ok) return
    const id = ideaService.convertToProject(idea)
    if (id) navigate(`/business/projects/${id}`)
  }

  return (
    <Card className="gap-2 px-3 py-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => openEdit(idea)} className="min-w-0 text-left font-medium hover:underline">
          {idea.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`“${idea.title}” amallari`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => openEdit(idea)}>
              <PencilIcon /> Tahrirlash
            </DropdownMenuItem>
            {!project && (
              <DropdownMenuItem onSelect={convert}>
                <ArrowRightIcon /> Loyihaga aylantirish
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => ideaService.setStatus(idea.id, 'paused')}>To‘xtatish</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => ideaService.setStatus(idea.id, 'rejected')}>Rad etish</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={async () => {
                if (await confirmDelete('G‘oya')) ideaService.remove(idea.id)
              }}
            >
              <Trash2Icon /> O‘chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {idea.problem && <p className="line-clamp-2 text-xs text-muted-foreground">{idea.problem}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="tabular text-xs text-muted-foreground">{score !== null ? `Baho: ${score} / 5` : 'Baholanmagan'}</span>
        {project && (
          <Link to={`/business/projects/${project.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <FolderIcon className="size-3.5" aria-hidden="true" /> Loyiha
          </Link>
        )}
      </div>
      <NativeSelect
        size="sm"
        value={idea.status}
        onChange={(e) => ideaService.setStatus(idea.id, e.target.value as Idea['status'])}
        aria-label={`“${idea.title}” holati`}
        className="w-full [&_select]:h-6 [&_select]:text-xs"
      >
        {IDEA_STATUSES.map((s) => (
          <NativeSelectOption key={s} value={s}>
            {IDEA_STATUS_LABELS[s]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Card>
  )
}

export function IdeasPage() {
  const ideas = useCollection('ideas')
  const openCreate = useIdeaEditor((s) => s.openCreate)
  const parked = ideas.filter((i) => i.status === 'paused' || i.status === 'rejected')

  if (ideas.length === 0) {
    return (
      <EmptyState
        icon={LightbulbIcon}
        title="G‘oyalar bazasi bo‘sh"
        description="Har bir g‘oyani yozib qo‘ying va keyinroq baholang: muammo kuchi, amalga oshirish osonligi, monetizatsiya va tarqatish kanali."
        action={<Button onClick={() => openCreate()}><PlusIcon /> G‘oya qo‘shish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => openCreate()}>
          <PlusIcon /> G‘oya
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {BOARD.map((status) => {
          const list = ideas
            .filter((i) => i.status === status)
            .sort((a, b) => (ideaScore(b) ?? 0) - (ideaScore(a) ?? 0))
          return (
            <section key={status} aria-label={IDEA_STATUS_LABELS[status]} className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-2.5">
              <header className="flex items-center justify-between px-0.5">
                <h2 className="text-sm font-medium">{IDEA_STATUS_LABELS[status]}</h2>
                <span className="tabular text-xs text-muted-foreground">{list.length}</span>
              </header>
              {list.map((i) => (
                <IdeaCard key={i.id} idea={i} />
              ))}
              {list.length === 0 && <p className="px-0.5 py-2 text-xs text-muted-foreground">Bo‘sh</p>}
            </section>
          )
        })}
      </div>
      {parked.length > 0 && (
        <details className="rounded-xl border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">To‘xtatilgan va rad etilgan ({parked.length})</summary>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {parked.map((i) => (
              <IdeaCard key={i.id} idea={i} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

const STAGE_TONES: Record<Contact['stage'], Tone> = { lead: 'muted', contacted: 'neutral', talking: 'primary', client: 'success', lost: 'muted' }

export function ContactsPage() {
  const contacts = useCollection('contacts')
  const projects = useCollection('projects')
  const openCreate = useContactEditor((s) => s.openCreate)
  const openEdit = useContactEditor((s) => s.openEdit)

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Mijozlar ro‘yxati bo‘sh"
        description="Potensial mijozlar va hamkorlar uchun yengil ro‘yxat: bosqich va keyingi qadam. Sezgir shaxsiy ma’lumotlarni saqlamang."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Kontakt qo‘shish</Button>}
      />
    )
  }

  const sorted = [...contacts].sort((a, b) => CONTACT_STAGES.indexOf(a.stage) - CONTACT_STAGES.indexOf(b.stage))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Kontakt
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <ul className="divide-y">
          {sorted.map((c) => {
            const project = c.projectId ? projects.find((p) => p.id === c.projectId) : undefined
            return (
              <li key={c.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <button type="button" onClick={() => openEdit(c)} className="font-medium hover:underline">
                    {c.name}
                  </button>
                  <p className="truncate text-xs text-muted-foreground">{[c.contactNote, project?.title].filter(Boolean).join(' · ')}</p>
                </div>
                <p className="text-sm">{c.nextStep ? <>Keyingi qadam: {c.nextStep}</> : <span className="text-muted-foreground">Keyingi qadam belgilanmagan</span>}</p>
                <div className="flex items-center gap-2 sm:justify-end">
                  <StatusBadge tone={STAGE_TONES[c.stage]}>{CONTACT_STAGE_LABELS[c.stage]}</StatusBadge>
                  <NativeSelect
                    size="sm"
                    value={c.stage}
                    onChange={(e) => contactService.update(c.id, { stage: e.target.value as Contact['stage'] }, 'Bosqich yangilandi')}
                    aria-label={`${c.name} bosqichi`}
                    className="[&_select]:h-7 [&_select]:text-xs"
                  >
                    {CONTACT_STAGES.map((s) => (
                      <NativeSelectOption key={s} value={s}>
                        {CONTACT_STAGE_LABELS[s]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${c.name} kontaktini o‘chirish`}
                    onClick={async () => {
                      if (await confirmDelete('Kontakt')) contactService.remove(c.id)
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
