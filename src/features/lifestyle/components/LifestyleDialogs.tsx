import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect } from '@/components/forms/selects'
import { checks, optionalText, requiredDate, requiredNumber, requiredText, str } from '@/components/forms/zod'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FAMILY_EVENT_KIND_LABELS, HEALTH_METRIC_PRESETS } from '@/constants/labels'
import { FAMILY_EVENT_KINDS } from '@/data/schema/entities'
import { useCollection, useToday } from '@/hooks/useData'
import { useFamilyEditor, useHealthEditor } from '../editor'
import { familyService, healthService } from '../service'

const healthSchema = z.object({
  date: requiredDate,
  metric: requiredText('Ko‘rsatkich nomini kiriting').max(40),
  value: requiredNumber(checks.nonNegative),
  unit: optionalText,
  note: optionalText,
})
type HIn = z.input<typeof healthSchema>
type HOut = z.output<typeof healthSchema>

function HealthFormDialog() {
  const { open, entity, defaults, close } = useHealthEditor()
  const logs = useCollection('healthLogs')
  const today = useToday()
  const { register, handleSubmit, reset, setValue, formState } = useForm<HIn, unknown, HOut>({ resolver: zodResolver(healthSchema) })
  useEffect(() => {
    if (!open) return
    const e = entity ?? defaults
    reset({ date: e?.date ?? today, metric: e?.metric ?? '', value: str(e?.value), unit: str(e?.unit), note: str(e?.note) })
  }, [open, entity, defaults, reset, today])
  const metrics = [...new Set([...HEALTH_METRIC_PRESETS.map((p) => p.metric), ...logs.map((l) => l.metric)])]
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? healthService.update(entity.id, v) : healthService.create(v)
    if (ok) close()
  })
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Yozuvni tahrirlash' : 'Salomatlik ko‘rsatkichi'} description="Faqat shaxsiy kuzatuv uchun. Tibbiy tavsiya berilmaydi." onSubmit={onSubmit}>
      <FormGrid>
        <FormField id="h-metric" label="Ko‘rsatkich" required error={formState.errors.metric?.message}>
          <Input
            list="h-metrics"
            autoFocus
            {...register('metric', {
              onChange: (e) => {
                const preset = HEALTH_METRIC_PRESETS.find((p) => p.metric === e.target.value)
                if (preset) setValue('unit', preset.unit)
              },
            })}
          />
        </FormField>
        <datalist id="h-metrics">
          {metrics.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <FormField id="h-date" label="Sana" required error={formState.errors.date?.message}>
          <Input type="date" max={today} {...register('date')} />
        </FormField>
        <FormField id="h-value" label="Qiymat" required error={formState.errors.value?.message}>
          <Input inputMode="decimal" {...register('value')} />
        </FormField>
        <FormField id="h-unit" label="Birlik">
          <Input placeholder="soat, km, qadam" {...register('unit')} />
        </FormField>
      </FormGrid>
      <FormField id="h-note" label="Izoh">
        <Input {...register('note')} />
      </FormField>
    </FormDialog>
  )
}

const familySchema = z.object({
  title: requiredText('Nomini kiriting').max(160),
  date: requiredDate,
  kind: z.enum(FAMILY_EVENT_KINDS),
  repeatsYearly: z.boolean(),
  note: optionalText,
})
type FIn = z.input<typeof familySchema>
type FOut = z.output<typeof familySchema>

function FamilyFormDialog() {
  const { open, entity, defaults, close } = useFamilyEditor()
  const today = useToday()
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<FIn, unknown, FOut>({ resolver: zodResolver(familySchema) })
  const repeats = watch('repeatsYearly')
  useEffect(() => {
    if (!open) return
    const e = entity ?? defaults
    reset({ title: e?.title ?? '', date: e?.date ?? today, kind: e?.kind ?? 'important_date', repeatsYearly: e?.repeatsYearly ?? false, note: str(e?.note) })
  }, [open, entity, defaults, reset, today])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? familyService.update(entity.id, v) : familyService.create({ ...v, done: false })
    if (ok) close()
  })
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Tahrirlash' : 'Oila: yangi yozuv'} onSubmit={onSubmit}>
      <FormField id="f-title" label="Nomi" required error={formState.errors.title?.message}>
        <Input autoFocus placeholder="Masalan: Onamning tug‘ilgan kuni" {...register('title')} />
      </FormField>
      <FormGrid>
        <FormField id="f-kind" label="Turi">
          <EnumSelect labels={FAMILY_EVENT_KIND_LABELS} {...register('kind')} />
        </FormField>
        <FormField id="f-date" label="Sana" required error={formState.errors.date?.message}>
          <Input type="date" {...register('date')} />
        </FormField>
      </FormGrid>
      <div className="flex items-center gap-2">
        <Checkbox id="f-yearly" checked={repeats} onCheckedChange={(c) => setValue('repeatsYearly', c === true)} />
        <Label htmlFor="f-yearly">Har yili takrorlanadi</Label>
      </div>
      <FormField id="f-note" label="Eslatma">
        <Input {...register('note')} />
      </FormField>
    </FormDialog>
  )
}

export function LifestyleDialogs() {
  return (
    <>
      <HealthFormDialog />
      <FamilyFormDialog />
    </>
  )
}
