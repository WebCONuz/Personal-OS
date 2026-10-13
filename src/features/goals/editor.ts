import { createEditorStore } from '@/lib/createEditorStore'
import type { Goal } from '@/types'

export const useGoalEditor = createEditorStore<Goal, Partial<Goal>>()
