import { repos, type NewEntity } from '@/data/repositories'
import { todayKey } from '@/services/date'
import type { Achievement, JobApplication, Skill } from '@/types'

export type SkillInput = NewEntity<Skill>
export type AchievementInput = NewEntity<Achievement>
export type JobInput = NewEntity<JobApplication>

export const skillService = {
  create: (input: SkillInput) => repos.skills.create(input, { success: 'Ko‘nikma qo‘shildi' }),
  update: (id: string, patch: Partial<SkillInput>) => repos.skills.update(id, patch, { success: 'Ko‘nikma yangilandi' }),
  markPracticed: (id: string) => repos.skills.update(id, { lastPracticedAt: todayKey() }, { success: 'Bugungi mashq qayd etildi' }),
  remove: (id: string) => repos.skills.remove(id, { success: 'Ko‘nikma o‘chirildi' }),
}

export const achievementService = {
  create: (input: AchievementInput) => repos.achievements.create(input, { success: 'Yutuq qayd etildi' }),
  update: (id: string, patch: Partial<AchievementInput>) => repos.achievements.update(id, patch, { success: 'Yutuq yangilandi' }),
  remove: (id: string) => repos.achievements.remove(id, { success: 'Yutuq o‘chirildi' }),
}

export const jobService = {
  create: (input: JobInput) => repos.jobApplications.create(input, { success: 'Ariza qo‘shildi' }),
  update: (id: string, patch: Partial<JobInput>, success = 'Ariza yangilandi') => repos.jobApplications.update(id, patch, { success }),
  setStatus: (job: JobApplication, status: JobApplication['status']) =>
    repos.jobApplications.update(
      job.id,
      { status, appliedAt: status === 'applied' && !job.appliedAt ? todayKey() : job.appliedAt },
      { success: 'Holat yangilandi' },
    ),
  remove: (id: string) => repos.jobApplications.remove(id, { success: 'Ariza o‘chirildi' }),
}
