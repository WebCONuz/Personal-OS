import { createEditorStore } from '@/lib/createEditorStore'
import type { Contact, Idea } from '@/types'

export const useIdeaEditor = createEditorStore<Idea>()
export const useContactEditor = createEditorStore<Contact>()
