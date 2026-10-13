import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect, OptionsSelect } from '@/components/forms/selects'
import { checks, optionalDate, optionalNumber, optionalText, optionalUrl, requiredDate, requiredNumber, requiredText, str } from '@/components/forms/zod'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ACHIEVEMENT_TYPE_LABELS, JOB_STATUS_LABELS, SKILL_CATEGORIES } from '@/constants/labels'
import { ACHIEVEMENT_TYPES, JOB_STATUSES } from '@/data/schema/entities'
import { useCollection, useToday } from '@/hooks/useData'
import { useAchievementEditor, useJobEditor, useSkillEditor } from '../editor'
import { achievementService, jobService, skillService } from '../service'

const LEVELS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} — ${['Boshlang‘ich', 'Asosiy', 'O‘rta', 'Kuchli', 'Ekspert'][n - 1]}` }))

// ---------- Skill ----------
const skillSchema = z
  .object({
    name: requiredText('Ko‘nikma nomini kiriting').max(80),
    category: requiredText('Kategoriya tanlang'),
    currentLevel: requiredNumber(checks.intRange(1, 5)),
    targetLevel: optionalNumber(checks.intRange(1, 5)),
    learningPlan: optionalText,
    evidenceNote: optionalText,
    lastPracticedAt: optionalDate,
  })
  .refine((v) => !v.targetLevel || v.targetLevel >= v.currentLevel, { path: ['targetLevel'], message: 'Maqsad daraja hozirgidan past bo‘lmasin' })
type SkillIn = z.input<typeof skillSchema>
type SkillOut = z.output<typeof skillSchema>

function SkillFormDialog() {
  const { open, entity, close } = useSkillEditor()
  const { register, handleSubmit, reset, formState } = useForm<SkillIn, unknown, SkillOut>({ resolver: zodResolver(skillSchema) })
  useEffect(() => {
    if (open)
      reset({
        name: entity?.name ?? '',
        category: entity?.category ?? 'Backend',
        currentLevel: str(entity?.currentLevel ?? 2),
        targetLevel: str(entity?.targetLevel),
        learningPlan: str(entity?.learningPlan),
        evidenceNote: str(entity?.evidenceNote),
        lastPracticedAt: str(entity?.lastPracticedAt),
      })
  }, [open, entity, reset])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? skillService.update(entity.id, v) : skillService.create(v)
    if (ok) close()
  })
  const e = formState.errors
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Ko‘nikmani tahrirlash' : 'Yangi ko‘nikma'} onSubmit={onSubmit} size="lg">
      <FormGrid>
        <FormField id="sk-name" label="Ko‘nikma" required error={e.name?.message}>
          <Input placeholder="Masalan: NestJS, PostgreSQL, System design" autoFocus {...register('name')} />
        </FormField>
        <FormField id="sk-cat" label="Kategoriya" required error={e.category?.message}>
          <Input list="sk-cats" {...register('category')} />
        </FormField>
        <datalist id="sk-cats">
          {SKILL_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <FormField id="sk-current" label="Hozirgi daraja (self-rating)" error={e.currentLevel?.message}>
          <OptionsSelect options={LEVELS} {...register('currentLevel')} />
        </FormField>
        <FormField id="sk-target" label="Maqsad daraja" error={e.targetLevel?.message}>
          <OptionsSelect emptyLabel="Belgilanmagan" options={LEVELS} {...register('targetLevel')} />
        </FormField>
        <FormField id="sk-last" label="Oxirgi mashq" error={e.lastPracticedAt?.message}>
          <Input type="date" {...register('lastPracticedAt')} />
        </FormField>
      </FormGrid>
      <FormField id="sk-plan" label="O‘rganish rejasi">
        <Textarea rows={3} placeholder="Qaysi mavzular, qaysi resurs, qanday amaliy loyiha orqali?" {...register('learningPlan')} />
      </FormField>
      <FormField id="sk-evidence" label="Amaliy dalil" hint="Loyiha, kod, portfolio linki yoki maqola">
        <Textarea rows={2} {...register('evidenceNote')} />
      </FormField>
    </FormDialog>
  )
}

// ---------- Achievement ----------
const achievementSchema = z.object({
  title: requiredText('Nomini kiriting').max(160),
  type: z.enum(ACHIEVEMENT_TYPES),
  date: requiredDate,
  url: optionalUrl,
  description: optionalText,
  skillIds: z.array(z.string()),
})
type AchIn = z.input<typeof achievementSchema>
type AchOut = z.output<typeof achievementSchema>

function AchievementFormDialog() {
  const { open, entity, close } = useAchievementEditor()
  const skills = useCollection('skills')
  const today = useToday()
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<AchIn, unknown, AchOut>({ resolver: zodResolver(achievementSchema) })
  const selected = watch('skillIds') ?? []
  useEffect(() => {
    if (open)
      reset({
        title: entity?.title ?? '',
        type: entity?.type ?? 'project',
        date: entity?.date ?? today,
        url: str(entity?.url),
        description: str(entity?.description),
        skillIds: entity?.skillIds ?? [],
      })
  }, [open, entity, reset, today])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? achievementService.update(entity.id, v) : achievementService.create(v)
    if (ok) close()
  })
  const e = formState.errors
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Yutuqni tahrirlash' : 'Yangi yutuq / dalil'} description="CV va portfolio uchun ko‘rinadigan natijalar." onSubmit={onSubmit} size="lg">
      <FormField id="ach-title" label="Natija" required error={e.title?.message}>
        <Input placeholder="Masalan: Open-source kutubxonaga PR qabul qilindi" autoFocus {...register('title')} />
      </FormField>
      <FormGrid>
        <FormField id="ach-type" label="Turi">
          <EnumSelect labels={ACHIEVEMENT_TYPE_LABELS} {...register('type')} />
        </FormField>
        <FormField id="ach-date" label="Sana" required error={e.date?.message}>
          <Input type="date" {...register('date')} />
        </FormField>
      </FormGrid>
      <FormField id="ach-url" label="Havola" error={e.url?.message}>
        <Input type="url" placeholder="https://github.com/…" {...register('url')} />
      </FormField>
      <FormField id="ach-desc" label="Tavsif">
        <Textarea rows={3} placeholder="Nima qildingiz va qanday natija bo‘ldi?" {...register('description')} />
      </FormField>
      {skills.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Bog‘liq ko‘nikmalar</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {skills.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.includes(s.id)}
                  onCheckedChange={(c) => setValue('skillIds', c ? [...selected, s.id] : selected.filter((id) => id !== s.id))}
                />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </FormDialog>
  )
}

// ---------- Job application ----------
const jobSchema = z.object({
  company: requiredText('Kompaniya nomini kiriting').max(120),
  role: requiredText('Lavozimni kiriting').max(120),
  url: optionalUrl,
  status: z.enum(JOB_STATUSES),
  appliedAt: optionalDate,
  nextAction: optionalText,
  notes: optionalText,
  interviewNotes: optionalText,
})
type JobIn = z.input<typeof jobSchema>
type JobOut = z.output<typeof jobSchema>

function JobFormDialog() {
  const { open, entity, close } = useJobEditor()
  const { register, handleSubmit, reset, formState } = useForm<JobIn, unknown, JobOut>({ resolver: zodResolver(jobSchema) })
  useEffect(() => {
    if (open)
      reset({
        company: entity?.company ?? '',
        role: entity?.role ?? '',
        url: str(entity?.url),
        status: entity?.status ?? 'wishlist',
        appliedAt: str(entity?.appliedAt),
        nextAction: str(entity?.nextAction),
        notes: str(entity?.notes),
        interviewNotes: str(entity?.interviewNotes),
      })
  }, [open, entity, reset])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? jobService.update(entity.id, v) : jobService.create(v)
    if (ok) close()
  })
  const e = formState.errors
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Arizani tahrirlash' : 'Yangi ish imkoniyati'} onSubmit={onSubmit} size="lg">
      <FormGrid>
        <FormField id="job-company" label="Kompaniya" required error={e.company?.message}>
          <Input autoFocus {...register('company')} />
        </FormField>
        <FormField id="job-role" label="Lavozim" required error={e.role?.message}>
          <Input placeholder="Senior Full-stack Developer" {...register('role')} />
        </FormField>
        <FormField id="job-status" label="Holat">
          <EnumSelect labels={JOB_STATUS_LABELS} {...register('status')} />
        </FormField>
        <FormField id="job-applied" label="Topshirilgan sana" error={e.appliedAt?.message}>
          <Input type="date" {...register('appliedAt')} />
        </FormField>
      </FormGrid>
      <FormField id="job-url" label="Vakansiya havolasi" error={e.url?.message} hint="Oddiy havola — ilova tashqi saytlarga ulanmaydi">
        <Input type="url" placeholder="https://…" {...register('url')} />
      </FormField>
      <FormField id="job-next" label="Keyingi qadam">
        <Input placeholder="Masalan: test topshirig‘ini juma kuni yuborish" {...register('nextAction')} />
      </FormField>
      <FormField id="job-notes" label="Izoh">
        <Textarea rows={2} {...register('notes')} />
      </FormField>
      <FormField id="job-interview" label="Intervyu qaydlari va saboqlar">
        <Textarea rows={3} placeholder="Qanday savollar berildi? Nimani yaxshiroq tayyorlash kerak?" {...register('interviewNotes')} />
      </FormField>
    </FormDialog>
  )
}

export function CareerDialogs() {
  return (
    <>
      <SkillFormDialog />
      <AchievementFormDialog />
      <JobFormDialog />
    </>
  )
}
