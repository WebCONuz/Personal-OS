import { createRepository } from './createRepository'

export { createRepository }
export type { NewEntity, EntityPatch, Repository } from './createRepository'

export const repos = {
  lifeAreas: createRepository('lifeAreas'),
  goals: createRepository('goals'),
  goalProgress: createRepository('goalProgress'),
  milestones: createRepository('milestones'),
  tasks: createRepository('tasks'),
  projects: createRepository('projects'),
  weeklyPlans: createRepository('weeklyPlans'),
  habits: createRepository('habits'),
  habitLogs: createRepository('habitLogs'),
  timeEntries: createRepository('timeEntries'),
  transactions: createRepository('transactions'),
  budgets: createRepository('budgets'),
  savingsGoals: createRepository('savingsGoals'),
  savingsContributions: createRepository('savingsContributions'),
  learningItems: createRepository('learningItems'),
  vocab: createRepository('vocab'),
  skills: createRepository('skills'),
  achievements: createRepository('achievements'),
  jobApplications: createRepository('jobApplications'),
  ideas: createRepository('ideas'),
  contacts: createRepository('contacts'),
  knowledgeNotes: createRepository('knowledgeNotes'),
  reviews: createRepository('reviews'),
  xpEvents: createRepository('xpEvents'),
  healthLogs: createRepository('healthLogs'),
  familyEvents: createRepository('familyEvents'),
}
