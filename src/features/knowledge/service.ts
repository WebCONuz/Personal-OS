import { repos, type NewEntity } from '@/data/repositories'
import type { KnowledgeNote } from '@/types'

export type NoteInput = NewEntity<KnowledgeNote>

/** "react, NestJS , react" → ["react", "nestjs"] (lowercase, unique, trimmed). */
export function parseTags(raw: string): string[] {
  return [...new Set(raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))]
}

export const noteService = {
  create(input: NoteInput) {
    return repos.knowledgeNotes.create(input, { success: 'Qayd saqlandi' })
  },
  update(id: string, patch: Partial<NoteInput>) {
    return repos.knowledgeNotes.update(id, patch, { success: 'Qayd yangilandi' })
  },
  remove(id: string) {
    return repos.knowledgeNotes.remove(id, { success: 'Qayd o‘chirildi' })
  },
}
