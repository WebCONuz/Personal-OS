/**
 * Central UI labels for enum values. Keeping them here (instead of inside components)
 * makes a future i18n layer a matter of replacing this module.
 */
import type {
  ACHIEVEMENT_TYPES,
  CONTACT_STAGES,
  CONTRIBUTION_TYPES,
  FAMILY_EVENT_KINDS,
  GOAL_METRICS,
  GOAL_STATUSES,
  HABIT_FREQUENCIES,
  IDEA_STATUSES,
  JOB_STATUSES,
  LEARNING_STATUSES,
  LEARNING_TYPES,
  PROJECT_KINDS,
  SAVINGS_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  THEMES,
  TRANSACTION_TYPES,
  WEEKLY_PLAN_STATUSES,
} from '@/data/schema/entities'

type Labels<T extends readonly string[]> = Record<T[number], string>

export const GOAL_STATUS_LABELS: Labels<typeof GOAL_STATUSES> = {
  planned: 'Rejada',
  active: 'Faol',
  paused: 'To‘xtatilgan',
  completed: 'Bajarilgan',
  cancelled: 'Bekor qilingan',
}

export const PROJECT_STATUS_LABELS = GOAL_STATUS_LABELS

export const THEME_LABELS: Labels<typeof THEMES> = {
  light: 'Yorug‘',
  dark: 'Qorong‘i',
  system: 'Tizim',
}

export const GOAL_METRIC_LABELS: Labels<typeof GOAL_METRICS> = {
  completion: 'Bajarildi / bajarilmadi',
  percent: 'Foizli progress',
  numeric: 'Sonli maqsad',
  milestone: 'Bosqichlar asosida',
}

export const TASK_STATUS_LABELS: Labels<typeof TASK_STATUSES> = {
  todo: 'Qilinadi',
  in_progress: 'Jarayonda',
  done: 'Bajarildi',
  cancelled: 'Bekor qilingan',
}

export const TASK_PRIORITY_LABELS: Labels<typeof TASK_PRIORITIES> = {
  low: 'Past',
  medium: 'O‘rta',
  high: 'Yuqori',
}

export const PROJECT_KIND_LABELS: Labels<typeof PROJECT_KINDS> = {
  work: 'Ish',
  business: 'Biznes',
  portfolio: 'Portfolio',
  research: 'Ilmiy ish',
  personal: 'Shaxsiy',
}

export const WEEKLY_PLAN_STATUS_LABELS: Labels<typeof WEEKLY_PLAN_STATUSES> = {
  draft: 'Qoralama',
  active: 'Faol',
  completed: 'Yakunlangan',
}

export const HABIT_FREQUENCY_LABELS: Labels<typeof HABIT_FREQUENCIES> = {
  daily: 'Har kuni',
  weekly: 'Haftada N marta',
}

export const TRANSACTION_TYPE_LABELS: Labels<typeof TRANSACTION_TYPES> = {
  income: 'Daromad',
  expense: 'Xarajat',
}

export const SAVINGS_STATUS_LABELS: Labels<typeof SAVINGS_STATUSES> = {
  active: 'Faol',
  paused: 'To‘xtatilgan',
  completed: 'Yig‘ildi',
  cancelled: 'Bekor qilingan',
}

export const CONTRIBUTION_TYPE_LABELS: Labels<typeof CONTRIBUTION_TYPES> = {
  deposit: 'Qo‘shish',
  withdrawal: 'Yechib olish',
}

export const LEARNING_TYPE_LABELS: Labels<typeof LEARNING_TYPES> = {
  course: 'Kurs',
  book: 'Kitob',
  article: 'Maqola',
  video: 'Video',
  topic: 'Mavzu',
}

export const LEARNING_STATUS_LABELS: Labels<typeof LEARNING_STATUSES> = {
  to_learn: 'O‘rganiladi',
  learning: 'O‘rganilmoqda',
  completed: 'Tugatilgan',
  paused: 'To‘xtatilgan',
}

export const ACHIEVEMENT_TYPE_LABELS: Labels<typeof ACHIEVEMENT_TYPES> = {
  project: 'Loyiha',
  code: 'Kod',
  portfolio: 'Portfolio',
  article: 'Maqola',
  certificate: 'Sertifikat',
  talk: 'Chiqish / taqdimot',
  other: 'Boshqa',
}

export const JOB_STATUS_LABELS: Labels<typeof JOB_STATUSES> = {
  wishlist: 'Ko‘zlangan',
  applied: 'Topshirilgan',
  interview: 'Intervyu',
  offer: 'Taklif',
  rejected: 'Rad etilgan',
  withdrawn: 'Qaytarib olingan',
}

export const IDEA_STATUS_LABELS: Labels<typeof IDEA_STATUSES> = {
  inbox: 'Inbox',
  researching: 'O‘rganilmoqda',
  validated: 'Tasdiqlangan',
  building: 'Qurilmoqda',
  launched: 'Ishga tushgan',
  paused: 'To‘xtatilgan',
  rejected: 'Rad etilgan',
}

export const CONTACT_STAGE_LABELS: Labels<typeof CONTACT_STAGES> = {
  lead: 'Potensial',
  contacted: 'Bog‘lanilgan',
  talking: 'Muzokara',
  client: 'Mijoz',
  lost: 'Yo‘qotilgan',
}

export const FAMILY_EVENT_KIND_LABELS: Labels<typeof FAMILY_EVENT_KINDS> = {
  important_date: 'Muhim sana',
  plan: 'Reja',
  note: 'Qayd',
}

export const EXPENSE_CATEGORIES = [
  'Oziq-ovqat',
  'Uy-joy',
  'Kommunal',
  'Transport',
  'Oila',
  'Salomatlik',
  'Ta’lim',
  'Dasturiy ta’minot',
  'Kiyim',
  'Ko‘ngilochar',
  'Biznes',
  'Boshqa',
] as const

export const INCOME_CATEGORIES = ['Maosh', 'Frilans', 'Biznes', 'Bonus', 'Sovg‘a', 'Boshqa'] as const

export const SKILL_CATEGORIES = ['Frontend', 'Backend', 'Ma’lumotlar bazasi', 'DevOps', 'AI', 'Soft skills', 'Til', 'Boshqa'] as const

export const HEALTH_METRIC_PRESETS = [
  { metric: 'Uyqu', unit: 'soat' },
  { metric: 'Qadamlar', unit: 'qadam' },
  { metric: 'Mashq', unit: 'daq' },
  { metric: 'Yurish', unit: 'km' },
  { metric: 'Vazn', unit: 'kg' },
  { metric: 'Suv', unit: 'stakan' },
] as const

/** Human names of stored collections (import preview, storage warnings). */
export const COLLECTION_LABELS: Record<string, string> = {
  lifeAreas: 'Hayot sohalari',
  goals: 'Maqsadlar',
  goalProgress: 'Progress yozuvlari',
  milestones: 'Bosqichlar',
  tasks: 'Vazifalar',
  projects: 'Loyihalar',
  weeklyPlans: 'Haftalik rejalar',
  habits: 'Odatlar',
  habitLogs: 'Odat loglari',
  timeEntries: 'Vaqt yozuvlari',
  transactions: 'Tranzaksiyalar',
  budgets: 'Budjetlar',
  savingsGoals: 'Jamg‘arma maqsadlari',
  savingsContributions: 'Jamg‘arma yozuvlari',
  learningItems: 'O‘quv resurslari',
  vocab: 'Iboralar',
  skills: 'Ko‘nikmalar',
  achievements: 'Yutuqlar',
  jobApplications: 'Ish arizalari',
  ideas: 'G‘oyalar',
  contacts: 'Kontaktlar',
  knowledgeNotes: 'Qaydlar',
  reviews: 'Review’lar',
  xpEvents: 'XP yozuvlari',
  healthLogs: 'Salomatlik yozuvlari',
  familyEvents: 'Oila yozuvlari',
  profile: 'Profil',
  timer: 'Taymer',
}
