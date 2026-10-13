import { PlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SearchInput } from '@/components/shared/SearchInput'
import { LifeAreaBadge } from '@/components/shared/LifeArea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTaskEditor } from '@/features/tasks/editor'
import { taskService } from '@/features/tasks/service'
import { useCollection } from '@/hooks/useData'
import { isOpen, sortByPriority } from '@/services/analytics'
import { formatMinutes, type DateKey } from '@/services/date'

/** Pick open tasks that are not planned for this week and add them in one step. */
export function AddTasksDialog({ week, open, onOpenChange }: { week: DateKey; open: boolean; onOpenChange: (o: boolean) => void }) {
  const tasks = useCollection('tasks')
  const openCreate = useTaskEditor((s) => s.openCreate)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortByPriority(tasks.filter((t) => isOpen(t) && t.weekStart !== week && (!q || t.title.toLowerCase().includes(q))))
  }, [tasks, week, query])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const add = () => {
    const ok = taskService.planManyForWeek([...selected], week)
    if (ok) {
      setSelected(new Set())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-base">Haftaga vazifa qo‘shish</DialogTitle>
          <DialogDescription>Inbox va boshqa haftalardagi ochiq vazifalardan tanlang.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pt-4">
          <SearchInput value={query} onChange={setQuery} className="sm:w-full" placeholder="Vazifani qidirish…" />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Rejalashtirilmagan ochiq vazifa yo‘q.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {candidates.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                    <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggle(t.id)} className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{t.title}</span>
                      <span className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <LifeAreaBadge areaId={t.lifeAreaId} />
                        {t.estimatedMinutes && <span>{formatMinutes(t.estimatedMinutes)}</span>}
                        {t.weekStart && <span>Boshqa haftada rejalashtirilgan</span>}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="m-0 items-center rounded-b-xl border-t px-5 py-3 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false)
              openCreate({ weekStart: week })
            }}
          >
            <PlusIcon /> Yangi vazifa yaratish
          </Button>
          <Button onClick={add} disabled={selected.size === 0}>
            {selected.size > 0 ? `${selected.size} ta vazifani qo‘shish` : 'Qo‘shish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
