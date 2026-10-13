import { createEditorStore } from '@/lib/createEditorStore'
import type { Project } from '@/types'

export const useProjectEditor = createEditorStore<Project, Partial<Project>>()
