import { createEditorStore } from '@/lib/createEditorStore'
import type { Task } from '@/types'

export const useTaskEditor = createEditorStore<Task, Partial<Task>>()
