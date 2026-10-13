import { createEditorStore } from '@/lib/createEditorStore'
import type { TimeEntry } from '@/types'

export const useTimeEntryEditor = createEditorStore<TimeEntry>()
