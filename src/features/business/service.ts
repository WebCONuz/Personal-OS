import { mutate } from '@/data/mutate'
import { repos, type NewEntity } from '@/data/repositories'
import { todayKey } from '@/services/date'
import type { Contact, Idea } from '@/types'

export type IdeaInput = NewEntity<Idea>
export type ContactInput = NewEntity<Contact>

/** Average of the four criteria (1–5). "ease" is scored so that easier = higher. */
export function ideaScore(idea: Pick<Idea, 'scores'>): number | null {
  if (!idea.scores) return null
  const { problem, ease, monetization, distribution } = idea.scores
  return Math.round(((problem + ease + monetization + distribution) / 4) * 10) / 10
}

export const ideaService = {
  create: (input: IdeaInput) => repos.ideas.create(input, { success: 'G‘oya saqlandi' }),
  update: (id: string, patch: Partial<IdeaInput>) => repos.ideas.update(id, patch, { success: 'G‘oya yangilandi' }),
  setStatus: (id: string, status: Idea['status']) => repos.ideas.update(id, { status }, { success: 'Holat yangilandi' }),
  remove: (id: string) => repos.ideas.remove(id, { success: 'G‘oya o‘chirildi' }),

  /** Creates a business project from an idea (explicit user action) and links them. */
  convertToProject(idea: Idea): string | null {
    const project = repos.projects.build({
      title: idea.title,
      description: [idea.problem && `Muammo: ${idea.problem}`, idea.audience && `Auditoriya: ${idea.audience}`].filter(Boolean).join('\n'),
      kind: 'business',
      status: 'planned',
      lifeAreaId: 'area-business',
      startDate: todayKey(),
      nextStep: 'MVP uchun eng kichik tekshiruvni belgilash',
    })
    const ok = mutate(
      (s) => ({
        ...repos.projects.withCreated(s, project),
        ...repos.ideas.withUpdated(s, idea.id, { projectId: project.id, status: idea.status === 'inbox' || idea.status === 'researching' || idea.status === 'validated' ? 'building' : idea.status }),
      }),
      { success: 'G‘oya loyihaga aylantirildi' },
    )
    return ok ? project.id : null
  },
}

export const contactService = {
  create: (input: ContactInput) => repos.contacts.create(input, { success: 'Kontakt qo‘shildi' }),
  update: (id: string, patch: Partial<ContactInput>, success = 'Kontakt yangilandi') => repos.contacts.update(id, patch, { success }),
  remove: (id: string) => repos.contacts.remove(id, { success: 'Kontakt o‘chirildi' }),
}
