import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect, OptionsSelect, ProjectSelect } from '@/components/forms/selects'
import { checks, optionalNumber, optionalText, requiredText, str } from '@/components/forms/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CONTACT_STAGE_LABELS, IDEA_STATUS_LABELS } from '@/constants/labels'
import { CONTACT_STAGES, IDEA_STATUSES } from '@/data/schema/entities'
import type { Idea } from '@/types'
import { useContactEditor, useIdeaEditor } from '../editor'
import { contactService, ideaService } from '../service'

const score = optionalNumber(checks.intRange(1, 5))
const SCORE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))

const ideaSchema = z
  .object({
    title: requiredText('G‘oya nomini kiriting').max(160),
    problem: z.string().trim(),
    audience: optionalText,
    competitors: optionalText,
    distributionStrategy: optionalText,
    monetizationIdea: optionalText,
    status: z.enum(IDEA_STATUSES),
    sProblem: score,
    sEase: score,
    sMonetization: score,
    sDistribution: score,
  })
  .superRefine((v, ctx) => {
    const filled = [v.sProblem, v.sEase, v.sMonetization, v.sDistribution].filter((x) => x !== undefined).length
    if (filled > 0 && filled < 4) ctx.addIssue({ code: 'custom', path: ['sProblem'], message: 'Baholash uchun to‘rt mezonning barchasini tanlang yoki hammasini bo‘sh qoldiring' })
  })
type IdeaIn = z.input<typeof ideaSchema>
type IdeaOut = z.output<typeof ideaSchema>

function ideaToForm(i: Partial<Idea> | null): IdeaIn {
  return {
    title: i?.title ?? '',
    problem: i?.problem ?? '',
    audience: str(i?.audience),
    competitors: str(i?.competitors),
    distributionStrategy: str(i?.distributionStrategy),
    monetizationIdea: str(i?.monetizationIdea),
    status: i?.status ?? 'inbox',
    sProblem: str(i?.scores?.problem),
    sEase: str(i?.scores?.ease),
    sMonetization: str(i?.scores?.monetization),
    sDistribution: str(i?.scores?.distribution),
  }
}

function IdeaFormDialog() {
  const { open, entity, defaults, close } = useIdeaEditor()
  const { register, handleSubmit, reset, formState } = useForm<IdeaIn, unknown, IdeaOut>({ resolver: zodResolver(ideaSchema), defaultValues: ideaToForm(null) })
  useEffect(() => {
    if (open) reset(ideaToForm(entity ?? defaults))
  }, [open, entity, defaults, reset])
  const onSubmit = handleSubmit(({ sProblem, sEase, sMonetization, sDistribution, ...v }) => {
    const scores =
      sProblem && sEase && sMonetization && sDistribution ? { problem: sProblem, ease: sEase, monetization: sMonetization, distribution: sDistribution } : undefined
    const input = { ...v, scores }
    const ok = entity ? ideaService.update(entity.id, input) : ideaService.create(input)
    if (ok) close()
  })
  const e = formState.errors
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'G‘oyani tahrirlash' : 'Yangi g‘oya'} onSubmit={onSubmit} size="lg">
      <FormGrid>
        <FormField id="idea-title" label="G‘oya" required error={e.title?.message}>
          <Input autoFocus placeholder="Masalan: Kichik klinikalar uchun navbat tizimi" {...register('title')} />
        </FormField>
        <FormField id="idea-status" label="Holat">
          <EnumSelect labels={IDEA_STATUS_LABELS} {...register('status')} />
        </FormField>
      </FormGrid>
      <FormField id="idea-problem" label="Kimning qanday muammosini hal qiladi?">
        <Textarea rows={3} {...register('problem')} />
      </FormField>
      <FormGrid>
        <FormField id="idea-audience" label="Taxminiy auditoriya">
          <Input {...register('audience')} />
        </FormField>
        <FormField id="idea-channel" label="Tarqatish kanali">
          <Input placeholder="Telegram, hamkorlar, SEO…" {...register('distributionStrategy')} />
        </FormField>
        <FormField id="idea-money" label="Monetizatsiya">
          <Input placeholder="Obuna, bir martalik to‘lov…" {...register('monetizationIdea')} />
        </FormField>
        <FormField id="idea-competitors" label="Raqobatchilar va bozor qaydlari">
          <Input {...register('competitors')} />
        </FormField>
      </FormGrid>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Baholash (1–5)</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FormField id="idea-s1" label="Muammo kuchi">
            <OptionsSelect emptyLabel="—" options={SCORE_OPTIONS} {...register('sProblem')} />
          </FormField>
          <FormField id="idea-s2" label="Amalga oshirish osonligi">
            <OptionsSelect emptyLabel="—" options={SCORE_OPTIONS} {...register('sEase')} />
          </FormField>
          <FormField id="idea-s3" label="Monetizatsiya ehtimoli">
            <OptionsSelect emptyLabel="—" options={SCORE_OPTIONS} {...register('sMonetization')} />
          </FormField>
          <FormField id="idea-s4" label="Tarqatish imkoniyati">
            <OptionsSelect emptyLabel="—" options={SCORE_OPTIONS} {...register('sDistribution')} />
          </FormField>
        </div>
        {e.sProblem && <p className="text-sm text-destructive" role="alert">{e.sProblem.message}</p>}
      </fieldset>
    </FormDialog>
  )
}

const contactSchema = z.object({
  name: requiredText('Ism yoki kompaniya nomini kiriting').max(120),
  contactNote: optionalText,
  stage: z.enum(CONTACT_STAGES),
  nextStep: optionalText,
  projectId: optionalText,
})
type CIn = z.input<typeof contactSchema>
type COut = z.output<typeof contactSchema>

function ContactFormDialog() {
  const { open, entity, close } = useContactEditor()
  const { register, handleSubmit, reset, formState } = useForm<CIn, unknown, COut>({ resolver: zodResolver(contactSchema) })
  useEffect(() => {
    if (open) reset({ name: entity?.name ?? '', contactNote: str(entity?.contactNote), stage: entity?.stage ?? 'lead', nextStep: str(entity?.nextStep), projectId: str(entity?.projectId) })
  }, [open, entity, reset])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? contactService.update(entity.id, v) : contactService.create(v)
    if (ok) close()
  })
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Kontaktni tahrirlash' : 'Yangi mijoz / prospekt'} description="Shaxsiy ish ro‘yxati — CRM emas." onSubmit={onSubmit}>
      <FormField id="ct-name" label="Nomi" required error={formState.errors.name?.message}>
        <Input autoFocus {...register('name')} />
      </FormField>
      <FormField id="ct-note" label="Aloqa qaydi" hint="Telefon raqami yoki parol kabi sezgir ma’lumotlarni saqlamang">
        <Input placeholder="Qayerda tanishildi, qanday ehtiyoj bor" {...register('contactNote')} />
      </FormField>
      <FormGrid>
        <FormField id="ct-stage" label="Bosqich">
          <EnumSelect labels={CONTACT_STAGE_LABELS} {...register('stage')} />
        </FormField>
        <FormField id="ct-project" label="Loyiha">
          <ProjectSelect {...register('projectId')} />
        </FormField>
      </FormGrid>
      <FormField id="ct-next" label="Keyingi qadam">
        <Input {...register('nextStep')} />
      </FormField>
    </FormDialog>
  )
}

export function BusinessDialogs() {
  return (
    <>
      <IdeaFormDialog />
      <ContactFormDialog />
    </>
  )
}
