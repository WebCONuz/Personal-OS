import { createEditorStore } from '@/lib/createEditorStore'
import type { KnowledgeNote } from '@/types'

export const useNoteEditor = createEditorStore<KnowledgeNote>()
