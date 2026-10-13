import { mutate } from '@/data/mutate'
import { removeEntities } from '@/data/relations'
import { repos, type NewEntity } from '@/data/repositories'
import type { Project } from '@/types'

export type ProjectInput = NewEntity<Project>

/** More active projects than this in parallel usually means context switching wins over progress. */
export const PARALLEL_PROJECT_SOFT_LIMIT = 3

export const projectService = {
  create(input: ProjectInput) {
    return repos.projects.create(input, { success: 'Loyiha yaratildi' })
  },
  update(id: string, patch: Partial<ProjectInput>, success = 'Loyiha yangilandi') {
    return repos.projects.update(id, patch, { success })
  },
  remove(id: string) {
    return mutate((s) => removeEntities(s, 'projects', [id]), { success: 'Loyiha o‘chirildi' })
  },
}
