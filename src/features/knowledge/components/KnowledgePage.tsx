import { ArrowLeftIcon, BookOpenIcon, FolderIcon, PencilIcon, PlusIcon, SearchXIcon, TargetIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import { Link } from 'react-router'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { SearchInput } from '@/components/shared/SearchInput'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCollection } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/services/date'
import { useNoteEditor } from '../editor'
import { noteService } from '../service'

/**
 * Markdown is rendered with react-markdown's safe defaults: raw HTML is not rendered
 * and dangerous URLs (javascript:) are stripped, so notes cannot inject scripts.
 */
function NoteBody({ content }: { content: string }) {
  return (
    <div
      className={cn(
        'max-w-none text-sm leading-relaxed',
        '[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-semibold',
        '[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5',
        '[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
        '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
      )}
    >
      <Markdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}

export function KnowledgePage() {
  const notes = useCollection('knowledgeNotes')
  const goals = useCollection('goals')
  const projects = useCollection('projects')
  const learningItems = useCollection('learningItems')
  const openCreate = useNoteEditor((s) => s.openCreate)
  const openEdit = useNoteEditor((s) => s.openEdit)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of notes) for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [notes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes
      .filter((n) => (!tag || n.tags.includes(tag)) && (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q))))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [notes, query, tag])

  const selected = notes.find((n) => n.id === selectedId) ?? null

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={BookOpenIcon}
        title="Bilimlar bazasi bo‘sh"
        description="O‘rganganlaringiz, yechimlar va g‘oyalarni qayd eting. Teglar va qidiruv orqali keyin tez topasiz."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Qayd yozish</Button>}
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className={cn('flex flex-col gap-3', selected && 'hidden lg:flex')}>
        <div className="flex gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Qaydlarni qidirish…" className="sm:w-full" />
          <Button onClick={() => openCreate()} aria-label="Yangi qayd">
            <PlusIcon />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Teglar bo‘yicha filtr">
            {tags.slice(0, 20).map(([t, count]) => (
              <button
                key={t}
                type="button"
                aria-pressed={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  tag === t ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                #{t} <span className="tabular opacity-70">{count}</span>
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 ? (
          <EmptyState compact icon={SearchXIcon} title="Qayd topilmadi" description="Boshqa so‘z yoki teg bilan qidiring." />
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  aria-current={selectedId === n.id ? 'true' : undefined}
                  className={cn(
                    'w-full rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    selectedId === n.id && 'border-primary/50 bg-accent/40',
                  )}
                >
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.content.replace(/[#*`>_-]/g, '').slice(0, 160) || 'Matn yo‘q'}</p>
                  {n.tags.length > 0 && <p className="mt-1 truncate text-xs text-primary">{n.tags.map((t) => `#${t}`).join(' ')}</p>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cn(!selected && 'hidden lg:block')}>
        {selected ? (
          <Card className="gap-4 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Button variant="ghost" size="sm" className="-ml-2 mb-1 lg:hidden" onClick={() => setSelectedId(null)}>
                  <ArrowLeftIcon /> Ro‘yxat
                </Button>
                <h2 className="text-xl font-semibold">{selected.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>Yangilangan: {formatDateTime(selected.updatedAt)}</span>
                  <LifeAreaBadge areaId={selected.lifeAreaId} />
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                  <PencilIcon /> Tahrirlash
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Qaydni o‘chirish"
                  onClick={async () => {
                    if (await confirmDelete('Qayd')) {
                      if (noteService.remove(selected.id)) setSelectedId(null)
                    }
                  }}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            {selected.content ? <NoteBody content={selected.content} /> : <p className="text-sm text-muted-foreground">Matn yo‘q.</p>}
            {(selected.linkedGoalIds.length > 0 || selected.linkedProjectIds.length > 0 || selected.linkedLearningItemIds.length > 0) && (
              <div className="flex flex-wrap gap-3 border-t pt-3 text-xs">
                {selected.linkedGoalIds.map((id) => {
                  const g = goals.find((x) => x.id === id)
                  return g ? <Link key={id} to={`/goals/${id}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"><TargetIcon className="size-3.5" aria-hidden="true" />{g.title}</Link> : null
                })}
                {selected.linkedProjectIds.map((id) => {
                  const p = projects.find((x) => x.id === id)
                  return p ? <Link key={id} to={`/business/projects/${id}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"><FolderIcon className="size-3.5" aria-hidden="true" />{p.title}</Link> : null
                })}
                {selected.linkedLearningItemIds.map((id) => {
                  const l = learningItems.find((x) => x.id === id)
                  return l ? <span key={id} className="inline-flex items-center gap-1 text-muted-foreground"><BookOpenIcon className="size-3.5" aria-hidden="true" />{l.title}</span> : null
                })}
              </div>
            )}
          </Card>
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">Ko‘rish uchun chapdan qaydni tanlang</div>
        )}
      </div>
    </div>
  )
}
