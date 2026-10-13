import { createEditorStore } from '@/lib/createEditorStore'
import type { LearningItem, VocabEntry } from '@/types'

export const useLearningEditor = createEditorStore<LearningItem>()
export const useVocabEditor = createEditorStore<VocabEntry>()
