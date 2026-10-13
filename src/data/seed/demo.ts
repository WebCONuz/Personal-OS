import { addDaysKey, monthKeyOf, startOfWeekKey, type DateKey } from '@/services/date'
import { XP_RULES } from '@/services/gamification/config'
import { habitXpSourceId } from '@/services/gamification/xp'
import { sanitizeReferences } from '../relations'
import { arrayCollections, type ArrayCollectionName, type DbState } from '../schema/db'
import { lifeAreaId as area } from './defaults'

/**
 * Demo dataset. Everything is relative to `today`, internally consistent (tasks point to existing
 * goals/projects) and every id starts with `demo-`, so it can be removed without touching user data.
 * It is example content only — not real personal data.
 */
export const DEMO_PREFIX = 'demo-'

type Arrays = { [K in ArrayCollectionName]: DbState[K] }

export function createDemoData(today: DateKey): Partial<Arrays> {
  const week = startOfWeekKey(today)
  const lastWeek = addDaysKey(week, -7)
  const day = (offset: number) => addDaysKey(today, offset)
  const wd = (i: number) => addDaysKey(week, i) // 0 = Monday
  const ts = (date: DateKey, hour = 10) => {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d, hour, 0, 0).toISOString()
  }
  const created = ts(day(-30), 9)
  const stamp = { createdAt: created, updatedAt: created }
  const month = monthKeyOf(today)
  const prevMonthDay = (d: number) => {
    const [y, m] = month.split('-').map(Number)
    const date = new Date(y, m - 2, d)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  const thisMonthDay = (d: number) => {
    const key = `${month}-${String(d).padStart(2, '0')}`
    return key > today ? today : key
  }

  const goals: Arrays['goals'] = [
    { id: 'demo-goal-career', title: 'Senior full-stack darajasiga chiqish', description: 'Arxitektura, system design va jamoani boshqarish ko‘nikmalarini mustahkamlash.', lifeAreaId: area('career'), status: 'active', metricType: 'milestone', currentValue: 0, startDate: day(-60), targetDate: day(240), ...stamp },
    { id: 'demo-goal-house', title: 'Uy uchun boshlang‘ich to‘lovni yig‘ish', description: 'Ipoteka uchun 30% boshlang‘ich to‘lov.', lifeAreaId: area('finance'), status: 'active', metricType: 'numeric', targetValue: 300_000_000, currentValue: 92_000_000, unit: 'so‘m', startDate: day(-120), targetDate: day(420), ...stamp },
    { id: 'demo-goal-english', title: 'Ingliz tili: IELTS 6.5', description: 'Speaking va writing ustida muntazam ishlash.', lifeAreaId: area('learning'), status: 'active', metricType: 'percent', targetValue: 100, unit: '%', currentValue: 45, startDate: day(-90), targetDate: day(150), ...stamp },
    { id: 'demo-goal-saas', title: 'SaaS MVP’ni ishga tushirish', description: 'Kichik bizneslar uchun CRM: birinchi 5 ta to‘lovchi mijoz.', lifeAreaId: area('business'), status: 'active', metricType: 'milestone', currentValue: 0, startDate: day(-45), targetDate: day(75), ...stamp },
    { id: 'demo-goal-thesis', title: 'Dissertatsiyaning 1-bobini yakunlash', description: '', lifeAreaId: area('learning'), status: 'planned', metricType: 'completion', currentValue: 0, targetDate: day(60), ...stamp },
  ]

  const milestones: Arrays['milestones'] = [
    { id: 'demo-ms-1', goalId: 'demo-goal-career', title: 'System design kursini tugatish', status: 'done', completedAt: ts(day(-20)), targetDate: day(-15), sortOrder: 0, ...stamp },
    { id: 'demo-ms-2', goalId: 'demo-goal-career', title: 'Portfolio saytni yangilash', status: 'todo', targetDate: day(20), sortOrder: 1, ...stamp },
    { id: 'demo-ms-3', goalId: 'demo-goal-career', title: '3 ta texnik maqola yozish', status: 'todo', targetDate: day(90), sortOrder: 2, ...stamp },
    { id: 'demo-ms-4', goalId: 'demo-goal-saas', title: 'Mijozlar bilan 10 ta suhbat', status: 'done', completedAt: ts(day(-10)), sortOrder: 0, ...stamp },
    { id: 'demo-ms-5', goalId: 'demo-goal-saas', title: 'MVP: auth + kontaktlar moduli', status: 'todo', targetDate: day(25), sortOrder: 1, ...stamp },
    { id: 'demo-ms-6', goalId: 'demo-goal-saas', title: 'Birinchi to‘lov', status: 'todo', targetDate: day(70), sortOrder: 2, ...stamp },
    { id: 'demo-ms-7', projectId: 'demo-proj-thesis', title: 'Adabiyotlar tahlili', status: 'done', completedAt: ts(day(-5)), sortOrder: 0, ...stamp },
    { id: 'demo-ms-8', projectId: 'demo-proj-thesis', title: 'Metodologiya bo‘limi', status: 'todo', targetDate: day(30), sortOrder: 1, ...stamp },
  ]

  const goalProgress: Arrays['goalProgress'] = [
    { id: 'demo-gp-1', goalId: 'demo-goal-house', value: 70_000_000, date: day(-90), note: 'Boshlang‘ich qiymat', ...stamp },
    { id: 'demo-gp-2', goalId: 'demo-goal-house', value: 78_000_000, date: day(-60), ...stamp },
    { id: 'demo-gp-3', goalId: 'demo-goal-house', value: 85_000_000, date: day(-30), ...stamp },
    { id: 'demo-gp-4', goalId: 'demo-goal-house', value: 92_000_000, date: day(-2), note: 'Oylik jamg‘arma', ...stamp },
    { id: 'demo-gp-5', goalId: 'demo-goal-english', value: 30, date: day(-60), ...stamp },
    { id: 'demo-gp-6', goalId: 'demo-goal-english', value: 45, date: day(-7), note: 'Mock test: 6.0', ...stamp },
  ]

  const projects: Arrays['projects'] = [
    { id: 'demo-proj-crm', title: 'Freelance CRM MVP', description: 'NestJS + React. Kichik jamoalar uchun mijozlar va bitimlarni kuzatish.', lifeAreaId: area('business'), status: 'active', kind: 'business', goalId: 'demo-goal-saas', startDate: day(-40), targetDate: day(25), nextStep: 'Kontaktlar jadvali uchun API endpointlarini yozish', ...stamp },
    { id: 'demo-proj-portfolio', title: 'Portfolio sayt', description: 'Loyihalar, maqolalar va CV bitta joyda.', lifeAreaId: area('career'), status: 'active', kind: 'portfolio', goalId: 'demo-goal-career', startDate: day(-14), targetDate: day(20), nextStep: 'Loyihalar bo‘limi uchun 3 ta case study yozish', ...stamp },
    { id: 'demo-proj-thesis', title: 'Dissertatsiya: 1-bob', description: 'Magistratura ilmiy ishi.', lifeAreaId: area('learning'), status: 'active', kind: 'research', goalId: 'demo-goal-thesis', startDate: day(-50), targetDate: day(60), ...stamp },
  ]

  const doneAt = (date: DateKey) => ({ status: 'done' as const, completedAt: ts(date, 18) })
  const tasks: Arrays['tasks'] = [
    { id: 'demo-task-1', title: 'CRM: kontaktlar CRUD API', description: 'NestJS modul, DTO validatsiya, testlar', priority: 'high', lifeAreaId: area('business'), projectId: 'demo-proj-crm', goalId: 'demo-goal-saas', weekStart: week, scheduledDate: wd(0), estimatedMinutes: 120, ...(wd(0) < today ? doneAt(wd(0)) : { status: 'todo' as const }), ...stamp },
    { id: 'demo-task-2', title: 'CRM: kontaktlar ro‘yxati UI', description: '', priority: 'medium', lifeAreaId: area('business'), projectId: 'demo-proj-crm', weekStart: week, scheduledDate: wd(2), estimatedMinutes: 90, ...(wd(2) < today ? doneAt(wd(2)) : { status: 'todo' as const }), ...stamp },
    { id: 'demo-task-3', title: 'Portfolio: case study #1', description: 'Muammo → yechim → natija formatida', priority: 'high', lifeAreaId: area('career'), projectId: 'demo-proj-portfolio', goalId: 'demo-goal-career', weekStart: week, scheduledDate: today, estimatedMinutes: 60, status: 'in_progress', ...stamp },
    { id: 'demo-task-4', title: 'IELTS writing task 2 — 1 ta insho', description: '', priority: 'medium', lifeAreaId: area('learning'), goalId: 'demo-goal-english', weekStart: week, scheduledDate: today, estimatedMinutes: 45, status: 'todo', ...stamp },
    { id: 'demo-task-5', title: 'Dissertatsiya: metodologiya rejasini yozish', description: '', priority: 'medium', lifeAreaId: area('learning'), projectId: 'demo-proj-thesis', weekStart: week, scheduledDate: wd(3), estimatedMinutes: 90, status: 'todo', ...stamp },
    { id: 'demo-task-6', title: 'Oilaviy sayohat uchun joy tanlash', description: '', priority: 'low', lifeAreaId: area('family'), weekStart: week, scheduledDate: wd(5), estimatedMinutes: 30, status: 'todo', ...stamp },
    { id: 'demo-task-7', title: 'Oylik byudjetni ko‘rib chiqish', description: '', priority: 'medium', lifeAreaId: area('finance'), goalId: 'demo-goal-house', weekStart: week, estimatedMinutes: 30, status: 'todo', dueDate: wd(6), ...stamp },
    { id: 'demo-task-8', title: 'System design: rate limiter misoli', description: '', priority: 'low', lifeAreaId: area('career'), goalId: 'demo-goal-career', weekStart: week, estimatedMinutes: 60, status: 'todo', ...stamp },
    { id: 'demo-task-9', title: 'CRM: auth moduli', description: '', priority: 'high', lifeAreaId: area('business'), projectId: 'demo-proj-crm', weekStart: lastWeek, scheduledDate: addDaysKey(lastWeek, 1), estimatedMinutes: 150, ...doneAt(addDaysKey(lastWeek, 1)), ...stamp },
    { id: 'demo-task-10', title: 'Mijoz suhbati: savollar ro‘yxati', description: '', priority: 'medium', lifeAreaId: area('business'), goalId: 'demo-goal-saas', weekStart: lastWeek, scheduledDate: addDaysKey(lastWeek, 3), estimatedMinutes: 45, ...doneAt(addDaysKey(lastWeek, 3)), ...stamp },
    { id: 'demo-task-11', title: 'Maqola g‘oyasi: NestJS’da modulli arxitektura', description: '', priority: 'low', lifeAreaId: area('career'), weekStart: lastWeek, estimatedMinutes: 60, status: 'cancelled', ...stamp },
    { id: 'demo-task-12', title: 'Docker compose bilan lokal muhitni sozlash', description: 'Inbox’dan', priority: 'medium', status: 'todo', ...stamp },
    { id: 'demo-task-13', title: 'Kitob: “Designing Data-Intensive Applications” 5-bob', description: '', priority: 'low', lifeAreaId: area('learning'), learningItemId: 'demo-li-ddia', status: 'todo', ...stamp },
  ]

  const weeklyPlans: Arrays['weeklyPlans'] = [
    {
      id: 'demo-plan-current',
      weekStart: week,
      weekEnd: addDaysKey(week, 6),
      priorities: [
        { id: 'demo-pr-1', title: 'CRM kontaktlar modulini tugatish', goalId: 'demo-goal-saas', done: false },
        { id: 'demo-pr-2', title: 'Portfolio uchun 1 ta case study', goalId: 'demo-goal-career', done: false },
        { id: 'demo-pr-3', title: '2 ta IELTS insho', goalId: 'demo-goal-english', done: false },
      ],
      capacityMinutes: 600,
      bufferPercent: 20,
      challenge: { title: '5 kun ingliz tilida 20 daqiqa', done: false },
      status: 'active',
      ...stamp,
    },
    {
      id: 'demo-plan-last',
      weekStart: lastWeek,
      weekEnd: addDaysKey(lastWeek, 6),
      priorities: [{ id: 'demo-pr-4', title: 'CRM auth moduli', done: true }],
      capacityMinutes: 600,
      bufferPercent: 20,
      status: 'completed',
      ...stamp,
    },
  ]

  const reviews: Arrays['reviews'] = [
    {
      id: 'demo-review-last',
      periodType: 'weekly',
      periodStart: lastWeek,
      periodEnd: addDaysKey(lastWeek, 6),
      wins: 'CRM auth moduli tayyor bo‘ldi. Ikkita potensial mijoz bilan suhbat.',
      worked: 'Ertalabki 1 soatlik fokus vaqt.',
      blockers: 'Ishdagi reliz sababli 2 kun kechqurun vaqt bo‘lmadi.',
      lessons: 'Haftaga 3 tadan ortiq katta vazifa rejalashtirmaslik.',
      neglectedAreaIds: [area('health')],
      keepDoing: 'Ertalabki fokus',
      stopDoing: 'Kechqurun telefonda vaqt yo‘qotish',
      startDoing: 'Haftada 2 marta yurish',
      nextPriorities: ['CRM kontaktlar modulini tugatish', 'Portfolio uchun 1 ta case study', '2 ta IELTS insho'],
      energy: 3,
      ...stamp,
    },
  ]

  const habits: Arrays['habits'] = [
    { id: 'demo-habit-english', title: '20 daqiqa ingliz tili', lifeAreaId: area('learning'), frequency: 'daily', targetPerWeek: 7, active: true, ...stamp },
    { id: 'demo-habit-walk', title: 'Yurish yoki mashq', lifeAreaId: area('health'), frequency: 'weekly', targetPerWeek: 3, active: true, ...stamp },
    { id: 'demo-habit-read', title: '15 daqiqa kitob o‘qish', lifeAreaId: area('knowledge'), frequency: 'daily', targetPerWeek: 7, active: true, ...stamp },
  ]
  const habitLogs: Arrays['habitLogs'] = []
  for (let i = 1; i <= 14; i++) {
    const date = day(-i)
    if (i % 4 !== 0) habitLogs.push({ id: `demo-hl-en-${i}`, habitId: 'demo-habit-english', date, completed: true, ...stamp })
    if (i % 3 === 0) habitLogs.push({ id: `demo-hl-walk-${i}`, habitId: 'demo-habit-walk', date, completed: true, ...stamp })
    if (i % 2 === 0) habitLogs.push({ id: `demo-hl-read-${i}`, habitId: 'demo-habit-read', date, completed: true, ...stamp })
  }

  const entry = (id: string, date: DateKey, minutes: number, extra: Partial<Arrays['timeEntries'][number]>): Arrays['timeEntries'][number] => ({
    id: `demo-te-${id}`,
    date,
    durationMinutes: minutes,
    source: 'manual',
    ...extra,
    ...stamp,
  })
  const timeEntries: Arrays['timeEntries'] = [
    entry('1', addDaysKey(lastWeek, 1), 160, { taskId: 'demo-task-9', projectId: 'demo-proj-crm' }),
    entry('2', addDaysKey(lastWeek, 3), 50, { taskId: 'demo-task-10' }),
    entry('3', addDaysKey(lastWeek, 4), 40, { lifeAreaId: area('learning'), note: 'Ingliz tili: speaking' }),
    entry('4', addDaysKey(lastWeek, 5), 90, { projectId: 'demo-proj-thesis' }),
    entry('5', wd(0) <= today ? wd(0) : today, 110, { taskId: 'demo-task-1', projectId: 'demo-proj-crm' }),
    entry('6', today, 30, { lifeAreaId: area('learning'), note: 'Ingliz tili: podcast' }),
    entry('7', today, 25, { taskId: 'demo-task-3', projectId: 'demo-proj-portfolio' }),
  ]

  const tx = (id: string, type: 'income' | 'expense', amount: number, currency: 'UZS' | 'USD', category: string, date: DateKey, extra: { note?: string; projectId?: string } = {}): Arrays['transactions'][number] => ({
    id: `demo-tx-${id}`,
    type,
    amount,
    currency,
    category,
    date,
    ...extra,
    ...stamp,
  })
  const transactions: Arrays['transactions'] = [
    tx('1', 'income', 18_000_000, 'UZS', 'Maosh', prevMonthDay(5)),
    tx('2', 'expense', 4_500_000, 'UZS', 'Uy-joy', prevMonthDay(6)),
    tx('3', 'expense', 3_200_000, 'UZS', 'Oziq-ovqat', prevMonthDay(18)),
    tx('4', 'income', 600, 'USD', 'Frilans', prevMonthDay(22), { note: 'Landing sahifa' }),
    tx('5', 'income', 18_000_000, 'UZS', 'Maosh', thisMonthDay(5)),
    tx('6', 'expense', 4_500_000, 'UZS', 'Uy-joy', thisMonthDay(6)),
    tx('7', 'expense', 2_400_000, 'UZS', 'Oziq-ovqat', thisMonthDay(10)),
    tx('8', 'expense', 650_000, 'UZS', 'Transport', thisMonthDay(11)),
    tx('9', 'expense', 29, 'USD', 'Dasturiy ta’minot', thisMonthDay(3), { note: 'Hosting', projectId: 'demo-proj-crm' }),
    tx('10', 'expense', 900_000, 'UZS', 'Ta’lim', thisMonthDay(8), { note: 'IELTS kursi' }),
  ]
  const budgets: Arrays['budgets'] = [
    { id: 'demo-budget-food', category: 'Oziq-ovqat', amount: 3_500_000, currency: 'UZS', ...stamp },
    { id: 'demo-budget-transport', category: 'Transport', amount: 800_000, currency: 'UZS', ...stamp },
    { id: 'demo-budget-software', category: 'Dasturiy ta’minot', amount: 50, currency: 'USD', ...stamp },
  ]
  const savingsGoals: Arrays['savingsGoals'] = [
    { id: 'demo-sav-house', title: 'Uy: boshlang‘ich to‘lov', targetAmount: 300_000_000, currency: 'UZS', targetDate: day(420), status: 'active', ...stamp },
    { id: 'demo-sav-car', title: 'Avtomobil', targetAmount: 12_000, currency: 'USD', targetDate: day(600), status: 'active', ...stamp },
  ]
  const savingsContributions: Arrays['savingsContributions'] = [
    { id: 'demo-sc-1', savingsGoalId: 'demo-sav-house', type: 'deposit', amount: 85_000_000, date: day(-40), note: 'Mavjud jamg‘arma', ...stamp },
    { id: 'demo-sc-2', savingsGoalId: 'demo-sav-house', type: 'deposit', amount: 7_000_000, date: day(-2), ...stamp },
    { id: 'demo-sc-3', savingsGoalId: 'demo-sav-car', type: 'deposit', amount: 1_500, date: day(-20), ...stamp },
  ]

  const learningItems: Arrays['learningItems'] = [
    { id: 'demo-li-ddia', title: 'Designing Data-Intensive Applications', type: 'book', status: 'learning', lifeAreaId: area('learning'), goalId: 'demo-goal-career', skillId: 'demo-skill-sd', startedAt: day(-25), notes: '5-bobgacha o‘qildi', ...stamp },
    { id: 'demo-li-sd', title: 'System Design kursi', type: 'course', status: 'completed', lifeAreaId: area('learning'), goalId: 'demo-goal-career', skillId: 'demo-skill-sd', startedAt: day(-70), completedAt: day(-20), outcome: 'Rate limiter va URL shortener dizaynlari portfolioga qo‘shildi', ...stamp },
    { id: 'demo-li-ielts', title: 'IELTS Writing Task 2 strategiyalari', type: 'video', status: 'to_learn', lifeAreaId: area('learning'), goalId: 'demo-goal-english', ...stamp },
  ]
  const vocab: Arrays['vocab'] = [
    { id: 'demo-v-1', phrase: 'to get the hang of something', meaning: 'biror narsani o‘zlashtirib olmoq', example: 'I finally got the hang of TypeScript generics.', learned: false, ...stamp },
    { id: 'demo-v-2', phrase: 'trade-off', meaning: 'murosaga kelish, bir narsa uchun boshqasidan voz kechish', learned: true, ...stamp },
    { id: 'demo-v-3', phrase: 'to be on the same page', meaning: 'bir xil fikrda bo‘lmoq', learned: false, ...stamp },
  ]
  const skills: Arrays['skills'] = [
    { id: 'demo-skill-react', name: 'React', category: 'Frontend', currentLevel: 4, targetLevel: 5, lastPracticedAt: day(-1), ...stamp },
    { id: 'demo-skill-nest', name: 'NestJS', category: 'Backend', currentLevel: 4, targetLevel: 5, lastPracticedAt: day(-2), learningPlan: 'CQRS va microservices bo‘limlari', ...stamp },
    { id: 'demo-skill-pg', name: 'PostgreSQL', category: 'Ma’lumotlar bazasi', currentLevel: 3, targetLevel: 4, lastPracticedAt: day(-12), learningPlan: 'Indekslar va query planner', ...stamp },
    { id: 'demo-skill-sd', name: 'System design', category: 'Backend', currentLevel: 2, targetLevel: 4, lastPracticedAt: day(-40), ...stamp },
    { id: 'demo-skill-ai', name: 'LLM ilovalar', category: 'AI', currentLevel: 2, targetLevel: 3, ...stamp },
  ]
  const achievements: Arrays['achievements'] = [
    { id: 'demo-ach-1', title: 'Ishda to‘lov modulini qayta yozib, javob vaqtini 40% kamaytirdim', type: 'project', date: day(-45), skillIds: ['demo-skill-nest', 'demo-skill-pg'], ...stamp },
    { id: 'demo-ach-2', title: 'System design kursi sertifikati', type: 'certificate', date: day(-20), skillIds: ['demo-skill-sd'], ...stamp },
    { id: 'demo-ach-3', title: 'Jamoa ichida React performance bo‘yicha taqdimot', type: 'talk', date: day(-8), skillIds: ['demo-skill-react'], ...stamp },
  ]
  const jobApplications: Arrays['jobApplications'] = [
    { id: 'demo-job-1', company: 'Namuna Tech', role: 'Senior Full-stack Developer', status: 'interview', appliedAt: day(-12), nextAction: 'Texnik intervyuga system design takrorlash', ...stamp },
    { id: 'demo-job-2', company: 'Misol Soft', role: 'Backend Engineer (NestJS)', status: 'applied', appliedAt: day(-4), ...stamp },
    { id: 'demo-job-3', company: 'Demo Fintech', role: 'Tech Lead', status: 'wishlist', nextAction: 'CV’ni yangilash', ...stamp },
  ]
  const ideas: Arrays['ideas'] = [
    { id: 'demo-idea-crm', title: 'Kichik jamoalar uchun CRM', problem: 'Frilanserlar mijozlarni Excel’da yuritadi va kuzatuvni yo‘qotadi', audience: 'Frilanserlar, kichik agentliklar', monetizationIdea: 'Oylik obuna', status: 'building', projectId: 'demo-proj-crm', scores: { problem: 4, ease: 3, monetization: 4, distribution: 3 }, ...stamp },
    { id: 'demo-idea-queue', title: 'Klinikalar uchun onlayn navbat', problem: 'Bemorlar navbatda soatlab kutadi', audience: 'Xususiy klinikalar', status: 'researching', scores: { problem: 5, ease: 2, monetization: 4, distribution: 2 }, ...stamp },
    { id: 'demo-idea-bot', title: 'Telegram orqali xarajat hisobi', problem: '', status: 'inbox', ...stamp },
  ]
  const contacts: Arrays['contacts'] = [
    { id: 'demo-ct-1', name: '“Grafika” dizayn studiyasi', contactNote: 'Tanish orqali', stage: 'talking', nextStep: 'MVP demo ko‘rsatish', projectId: 'demo-proj-crm', ...stamp },
    { id: 'demo-ct-2', name: 'Frilanser marketolog', stage: 'lead', nextStep: 'Muammo bo‘yicha qisqa suhbat', ...stamp },
  ]
  const knowledgeNotes: Arrays['knowledgeNotes'] = [
    { id: 'demo-note-1', title: 'NestJS: Guard va Interceptor farqi', content: '## Guard\nSo‘rov handler’ga **yetib borishi kerakmi** — shuni hal qiladi (auth, rollar).\n\n## Interceptor\nHandler’dan **oldin va keyin** ishlaydi: logging, javobni o‘zgartirish, cache.\n\n```ts\n@UseGuards(AuthGuard)\n@UseInterceptors(LoggingInterceptor)\n```', tags: ['nestjs', 'backend'], lifeAreaId: area('knowledge'), linkedGoalIds: ['demo-goal-career'], linkedProjectIds: [], linkedLearningItemIds: [], ...stamp },
    { id: 'demo-note-2', title: 'Mijoz suhbati uchun savollar', content: '- Hozir bu muammoni qanday hal qilyapsiz?\n- Oxirgi marta qachon bu muammo bo‘ldi?\n- Bunga qancha vaqt/pul ketadi?\n\n> Yechimni emas, muammoni so‘rang.', tags: ['biznes', 'customer-development'], lifeAreaId: area('business'), linkedGoalIds: [], linkedProjectIds: ['demo-proj-crm'], linkedLearningItemIds: [], ...stamp },
    { id: 'demo-note-3', title: 'Replication turlari (DDIA 5-bob)', content: 'Single-leader, multi-leader, leaderless. Asosiy muammo — **replication lag**.', tags: ['database', 'kitob'], lifeAreaId: area('knowledge'), linkedGoalIds: [], linkedProjectIds: [], linkedLearningItemIds: ['demo-li-ddia'], ...stamp },
  ]
  const healthLogs: Arrays['healthLogs'] = Array.from({ length: 7 }, (_, i) => ({
    id: `demo-hl-sleep-${i}`,
    date: day(-(i + 1)),
    metric: 'Uyqu',
    value: [7, 6.5, 7.5, 6, 7, 8, 6.5][i],
    unit: 'soat',
    ...stamp,
  }))
  const familyEvents: Arrays['familyEvents'] = [
    { id: 'demo-fam-1', title: 'Onamning tug‘ilgan kuni (namuna)', date: `2000-${day(12).slice(5)}`, kind: 'important_date', repeatsYearly: true, done: false, ...stamp },
    { id: 'demo-fam-2', title: 'Oilaviy dam olish kuni', date: wd(6), kind: 'plan', repeatsYearly: false, done: false, ...stamp },
    { id: 'demo-fam-3', title: 'Bolalar bilan haftada bir marta park', date: day(-3), kind: 'note', repeatsYearly: false, note: 'Shanba ertalab qulay', done: false, ...stamp },
  ]

  // XP history consistent with the rules: one event per completed task / habit day / milestone.
  const xpEvents: Arrays['xpEvents'] = []
  for (const t of tasks) {
    if (t.status === 'done' && t.completedAt) {
      xpEvents.push({ id: `demo-xp-${t.id}`, sourceType: 'task', sourceId: t.id, points: XP_RULES.task[t.priority], reason: `Vazifa: ${t.title}`, createdAt: t.completedAt })
    }
  }
  for (const l of habitLogs) {
    const habit = habits.find((h) => h.id === l.habitId)!
    xpEvents.push({ id: `demo-xp-${l.id}`, sourceType: 'habit', sourceId: habitXpSourceId(l.habitId, l.date), points: XP_RULES.habit, reason: `Odat: ${habit.title}`, createdAt: ts(l.date, 21) })
  }
  for (const m of milestones) {
    if (m.status === 'done' && m.completedAt) {
      xpEvents.push({ id: `demo-xp-${m.id}`, sourceType: 'milestone', sourceId: m.id, points: XP_RULES.milestone, reason: `Bosqich: ${m.title}`, createdAt: m.completedAt })
    }
  }
  xpEvents.push({ id: 'demo-xp-review', sourceType: 'review', sourceId: `weekly:${lastWeek}`, points: XP_RULES.weeklyReview, reason: 'Haftalik review', createdAt: ts(addDaysKey(lastWeek, 6), 20) })

  return {
    goals,
    milestones,
    goalProgress,
    projects,
    tasks,
    weeklyPlans,
    reviews,
    habits,
    habitLogs,
    timeEntries,
    transactions,
    budgets,
    savingsGoals,
    savingsContributions,
    learningItems,
    vocab,
    skills,
    achievements,
    jobApplications,
    ideas,
    contacts,
    knowledgeNotes,
    healthLogs,
    familyEvents,
    xpEvents,
  }
}

/** Adds demo data to the current state. Existing user records are kept; demo records are replaced. */
export function withDemoData(state: DbState, today: DateKey): DbState {
  const demo = createDemoData(today)
  const next = { ...state } as Record<string, unknown>
  for (const name of Object.keys(arrayCollections) as ArrayCollectionName[]) {
    const items = demo[name]
    if (!items) continue
    const kept = (state[name] as Array<{ id: string }>).filter((x) => !x.id.startsWith(DEMO_PREFIX))
    next[name] = [...kept, ...items]
  }
  return next as DbState
}

/** Removes every demo record and unlinks user records that referenced demo entities. */
export function withoutDemoData(state: DbState): DbState {
  const next = { ...state } as Record<string, unknown>
  for (const name of Object.keys(arrayCollections) as ArrayCollectionName[]) {
    next[name] = (state[name] as Array<{ id: string }>).filter((x) => !x.id.startsWith(DEMO_PREFIX))
  }
  const cleaned = next as DbState
  // XP earned later by completing demo tasks/habits points at demo sources — it goes with the demo.
  cleaned.xpEvents = cleaned.xpEvents.filter((e) => !e.sourceId?.startsWith(DEMO_PREFIX))
  // Weekly-plan priorities have nested ids; drop demo priorities from user plans too.
  cleaned.weeklyPlans = cleaned.weeklyPlans.map((p) => ({ ...p, priorities: p.priorities.filter((x) => !x.id.startsWith(DEMO_PREFIX)) }))
  return sanitizeReferences(cleaned).state
}

export function countDemoRecords(state: DbState): number {
  return (Object.keys(arrayCollections) as ArrayCollectionName[]).reduce(
    (sum, name) => sum + (state[name] as Array<{ id: string }>).filter((x) => x.id.startsWith(DEMO_PREFIX)).length,
    0,
  )
}
