import { BookOpenIcon, BriefcaseIcon, FolderIcon, GraduationCapIcon, LightbulbIcon, ListTodoIcon, SparklesIcon, TargetIcon, UserIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { create } from 'zustand'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useTaskEditor } from '@/features/tasks/editor'
import { useNoteEditor } from '@/features/knowledge/editor'
import { useContactEditor, useIdeaEditor } from '@/features/business/editor'
import { useJobEditor, useSkillEditor } from '@/features/career/editor'
import { useLearningEditor } from '@/features/learning/editor'
import { useDbState } from '@/hooks/useData'
import { MAIN_NAV, SETTINGS_NAV } from '../config/navigation'

export const useSearchOpen = create<{ open: boolean; setOpen: (o: boolean) => void }>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

/** Global quick search (Ctrl/⌘ + K) across main entities and pages. */
export function CommandSearch() {
  const { open, setOpen } = useSearchOpen()
  const navigate = useNavigate()
  const state = useDbState()
  const openTask = useTaskEditor((s) => s.openEdit)
  const openNote = useNoteEditor((s) => s.openEdit)
  const openLearning = useLearningEditor((s) => s.openEdit)
  const openIdea = useIdeaEditor((s) => s.openEdit)
  const openSkill = useSkillEditor((s) => s.openEdit)
  const openJob = useJobEditor((s) => s.openEdit)
  const openContact = useContactEditor((s) => s.openEdit)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!useSearchOpen.getState().open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const go = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Qidiruv" description="Maqsad, vazifa, loyiha, qayd yoki sahifani qidiring">
      {/* cmdk parts must live inside the <Command> root (it provides the store). */}
      <Command>
        <CommandInput placeholder="Qidirish…" />
        <CommandList>
          <CommandEmpty>Hech narsa topilmadi.</CommandEmpty>
          <CommandGroup heading="Sahifalar">
            {[...MAIN_NAV, SETTINGS_NAV].map((item) => (
              <CommandItem key={item.to} value={`sahifa ${item.label}`} onSelect={() => go(() => navigate(item.to))}>
                <item.icon /> {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          {state.goals.length > 0 && (
            <CommandGroup heading="Maqsadlar">
              {state.goals.map((g) => (
                <CommandItem key={g.id} value={`maqsad ${g.title} ${g.id}`} onSelect={() => go(() => navigate(`/goals/${g.id}`))}>
                  <TargetIcon /> {g.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {state.tasks.length > 0 && (
            <CommandGroup heading="Vazifalar">
              {state.tasks
                .filter((t) => t.status !== 'cancelled')
                .map((t) => (
                  <CommandItem key={t.id} value={`vazifa ${t.title} ${t.id}`} onSelect={() => go(() => openTask(t))}>
                    <ListTodoIcon /> <span className={t.status === 'done' ? 'text-muted-foreground line-through' : undefined}>{t.title}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
          {state.projects.length > 0 && (
            <CommandGroup heading="Loyihalar">
              {state.projects.map((p) => (
                <CommandItem key={p.id} value={`loyiha ${p.title} ${p.id}`} onSelect={() => go(() => navigate(`/business/projects/${p.id}`))}>
                  <FolderIcon /> {p.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {state.knowledgeNotes.length > 0 && (
            <CommandGroup heading="Qaydlar">
              {state.knowledgeNotes.map((n) => (
                <CommandItem key={n.id} value={`qayd ${n.title} ${n.tags.join(' ')} ${n.id}`} onSelect={() => go(() => { navigate('/learning/notes'); openNote(n) })}>
                  <BookOpenIcon /> {n.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {state.learningItems.length > 0 && (
            <CommandGroup heading="O‘quv resurslari">
              {state.learningItems.map((l) => (
                <CommandItem key={l.id} value={`resurs ${l.title} ${l.id}`} onSelect={() => go(() => { navigate('/learning'); openLearning(l) })}>
                  <GraduationCapIcon /> {l.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {state.ideas.length > 0 && (
            <CommandGroup heading="G‘oyalar">
              {state.ideas.map((i) => (
                <CommandItem key={i.id} value={`goya ${i.title} ${i.id}`} onSelect={() => go(() => { navigate('/business/ideas'); openIdea(i) })}>
                  <LightbulbIcon /> {i.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {state.skills.length > 0 && (
            <CommandGroup heading="Ko‘nikmalar">
              {state.skills.map((s) => (
                <CommandItem key={s.id} value={`konikma ${s.name} ${s.category} ${s.id}`} onSelect={() => go(() => { navigate('/career'); openSkill(s) })}>
                  <SparklesIcon /> {s.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {state.jobApplications.length > 0 && (
            <CommandGroup heading="Ish imkoniyatlari">
              {state.jobApplications.map((j) => (
                <CommandItem key={j.id} value={`ish ${j.company} ${j.role} ${j.id}`} onSelect={() => go(() => { navigate('/career/jobs'); openJob(j) })}>
                  <BriefcaseIcon /> {j.role} · {j.company}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {state.contacts.length > 0 && (
            <CommandGroup heading="Mijozlar">
              {state.contacts.map((ct) => (
                <CommandItem key={ct.id} value={`mijoz ${ct.name} ${ct.id}`} onSelect={() => go(() => { navigate('/business/contacts'); openContact(ct) })}>
                  <UserIcon /> {ct.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
