import { createEditorStore } from '@/lib/createEditorStore'
import type { Habit } from '@/types'

export const useHabitEditor = createEditorStore<Habit>()
