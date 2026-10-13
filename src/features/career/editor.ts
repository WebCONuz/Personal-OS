import { createEditorStore } from '@/lib/createEditorStore'
import type { Achievement, JobApplication, Skill } from '@/types'

export const useSkillEditor = createEditorStore<Skill>()
export const useAchievementEditor = createEditorStore<Achievement>()
export const useJobEditor = createEditorStore<JobApplication>()
