import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDialog } from '@/components/forms/FormDialog'
import { FormField, FormGrid } from '@/components/forms/FormField'
import { EnumSelect, OptionsSelect, ProjectSelect } from '@/components/forms/selects'
import { checks, optionalDate, optionalText, requiredDate, requiredNumber, requiredText, str } from '@/components/forms/zod'
import { Input } from '@/components/ui/input'
import { CONTRIBUTION_TYPE_LABELS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, SAVINGS_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/constants/labels'
import { CONTRIBUTION_TYPES, SAVINGS_STATUSES, TRANSACTION_TYPES } from '@/data/schema/entities'
import { useCollection, useProfile, useToday } from '@/hooks/useData'
import { CURRENCIES } from '@/services/money'
import { useBudgetEditor, useContributionEditor, useSavingsEditor, useTransactionEditor } from '../editor'
import { budgetService, savingsService, transactionService } from '../service'

const amount = requiredNumber(checks.positive, 'Summani kiriting')
const currency = z.enum(CURRENCIES)

// ---------- Transaction ----------

const txSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount,
  currency,
  category: requiredText('Kategoriyani kiriting').max(60),
  date: requiredDate,
  note: optionalText,
  projectId: optionalText,
})
type TxIn = z.input<typeof txSchema>
type TxOut = z.output<typeof txSchema>

export function TransactionFormDialog() {
  const { open, entity, defaults, close } = useTransactionEditor()
  const profile = useProfile()
  const today = useToday()
  const transactions = useCollection('transactions')
  const { register, handleSubmit, reset, watch, formState } = useForm<TxIn, unknown, TxOut>({ resolver: zodResolver(txSchema) })
  const type = watch('type')
  const errors = formState.errors

  useEffect(() => {
    if (!open) return
    const e = entity ?? defaults
    reset({
      type: e?.type ?? 'expense',
      amount: str(e?.amount),
      currency: e?.currency ?? profile.defaultCurrency,
      category: e?.category ?? '',
      date: e?.date ?? today,
      note: str(e?.note),
      projectId: str(e?.projectId),
    })
  }, [open, entity, defaults, reset, today, profile.defaultCurrency])

  // Suggest preset categories plus any custom categories the user already used.
  const used = transactions.filter((t) => t.type === type).map((t) => t.category)
  const suggestions = [...new Set([...(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES), ...used])]

  const onSubmit = handleSubmit((v) => {
    const ok = entity ? transactionService.update(entity.id, v) : transactionService.create(v)
    if (ok) close()
  })

  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Tranzaksiyani tahrirlash' : 'Yangi tranzaksiya'} onSubmit={onSubmit}>
      <FormGrid>
        <FormField id="tx-type" label="Turi">
          <EnumSelect labels={TRANSACTION_TYPE_LABELS} {...register('type')} />
        </FormField>
        <FormField id="tx-date" label="Sana" required error={errors.date?.message}>
          <Input type="date" {...register('date')} />
        </FormField>
        <FormField id="tx-amount" label="Summa" required error={errors.amount?.message}>
          <Input inputMode="decimal" placeholder="150 000" autoFocus {...register('amount')} />
        </FormField>
        <FormField id="tx-currency" label="Valyuta">
          <OptionsSelect options={CURRENCIES} {...register('currency')} />
        </FormField>
        <FormField id="tx-category" label="Kategoriya" required error={errors.category?.message} className="sm:col-span-2">
          <Input list="tx-categories" placeholder="Tanlang yoki yozing" {...register('category')} />
        </FormField>
        <datalist id="tx-categories">
          {suggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <FormField id="tx-project" label="Loyiha (biznes uchun)">
          <ProjectSelect {...register('projectId')} />
        </FormField>
        <FormField id="tx-note" label="Izoh">
          <Input {...register('note')} />
        </FormField>
      </FormGrid>
    </FormDialog>
  )
}

// ---------- Budget ----------

const budgetSchema = z.object({ category: requiredText('Kategoriyani kiriting').max(60), amount, currency })
type BIn = z.input<typeof budgetSchema>
type BOut = z.output<typeof budgetSchema>

export function BudgetFormDialog() {
  const { open, entity, close } = useBudgetEditor()
  const profile = useProfile()
  const { register, handleSubmit, reset, formState } = useForm<BIn, unknown, BOut>({ resolver: zodResolver(budgetSchema) })
  useEffect(() => {
    if (open) reset({ category: entity?.category ?? '', amount: str(entity?.amount), currency: entity?.currency ?? profile.defaultCurrency })
  }, [open, entity, reset, profile.defaultCurrency])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? budgetService.update(entity.id, v) : budgetService.create(v)
    if (ok) close()
  })
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Budjetni tahrirlash' : 'Oylik budjet limiti'} description="Limit har oy uchun amal qiladi." onSubmit={onSubmit}>
      <FormField id="b-category" label="Xarajat kategoriyasi" required error={formState.errors.category?.message}>
        <Input list="b-categories" autoFocus {...register('category')} />
      </FormField>
      <datalist id="b-categories">
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <FormGrid>
        <FormField id="b-amount" label="Oylik limit" required error={formState.errors.amount?.message}>
          <Input inputMode="decimal" {...register('amount')} />
        </FormField>
        <FormField id="b-currency" label="Valyuta">
          <OptionsSelect options={CURRENCIES} {...register('currency')} />
        </FormField>
      </FormGrid>
    </FormDialog>
  )
}

// ---------- Savings goal ----------

const savingsSchema = z.object({
  title: requiredText('Nomini kiriting').max(120),
  targetAmount: amount,
  currency,
  targetDate: optionalDate,
  status: z.enum(SAVINGS_STATUSES),
  note: optionalText,
})
type SIn = z.input<typeof savingsSchema>
type SOut = z.output<typeof savingsSchema>

export function SavingsGoalFormDialog() {
  const { open, entity, close } = useSavingsEditor()
  const profile = useProfile()
  const { register, handleSubmit, reset, formState } = useForm<SIn, unknown, SOut>({ resolver: zodResolver(savingsSchema) })
  useEffect(() => {
    if (open)
      reset({
        title: entity?.title ?? '',
        targetAmount: str(entity?.targetAmount),
        currency: entity?.currency ?? profile.defaultCurrency,
        targetDate: str(entity?.targetDate),
        status: entity?.status ?? 'active',
        note: str(entity?.note),
      })
  }, [open, entity, reset, profile.defaultCurrency])
  const onSubmit = handleSubmit((v) => {
    const ok = entity ? savingsService.update(entity.id, v) : savingsService.create(v)
    if (ok) close()
  })
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={entity ? 'Jamg‘arma maqsadini tahrirlash' : 'Yangi jamg‘arma maqsadi'} onSubmit={onSubmit}>
      <FormField id="s-title" label="Nomi" required error={formState.errors.title?.message}>
        <Input placeholder="Masalan: Uy uchun boshlang‘ich to‘lov" autoFocus {...register('title')} />
      </FormField>
      <FormGrid>
        <FormField id="s-amount" label="Target summa" required error={formState.errors.targetAmount?.message}>
          <Input inputMode="decimal" {...register('targetAmount')} />
        </FormField>
        <FormField id="s-currency" label="Valyuta" hint={entity ? 'Mavjud yozuvlar shu valyutada hisoblanadi' : undefined}>
          <OptionsSelect options={CURRENCIES} disabled={!!entity} {...register('currency')} />
        </FormField>
        <FormField id="s-date" label="Maqsad sanasi" error={formState.errors.targetDate?.message}>
          <Input type="date" {...register('targetDate')} />
        </FormField>
        <FormField id="s-status" label="Holat">
          <EnumSelect labels={SAVINGS_STATUS_LABELS} {...register('status')} />
        </FormField>
      </FormGrid>
      <FormField id="s-note" label="Izoh">
        <Input {...register('note')} />
      </FormField>
    </FormDialog>
  )
}

// ---------- Contribution ----------

const contributionSchema = z.object({ type: z.enum(CONTRIBUTION_TYPES), amount, date: requiredDate, note: optionalText })
type CIn = z.input<typeof contributionSchema>
type COut = z.output<typeof contributionSchema>

export function ContributionFormDialog() {
  const { open, defaults, close } = useContributionEditor()
  const goals = useCollection('savingsGoals')
  const today = useToday()
  const goal = goals.find((g) => g.id === defaults?.savingsGoalId)
  const { register, handleSubmit, reset, formState } = useForm<CIn, unknown, COut>({ resolver: zodResolver(contributionSchema) })
  useEffect(() => {
    if (open) reset({ type: defaults?.type ?? 'deposit', amount: '', date: today, note: '' })
  }, [open, defaults, reset, today])
  const onSubmit = handleSubmit((v) => {
    if (!goal) return
    if (savingsService.addContribution({ ...v, savingsGoalId: goal.id })) close()
  })
  return (
    <FormDialog open={open} onOpenChange={(o) => !o && close()} title={goal ? `${goal.title}` : 'Jamg‘arma'} description={goal ? `Valyuta: ${goal.currency}` : undefined} onSubmit={onSubmit}>
      <FormGrid>
        <FormField id="c-type" label="Amal">
          <EnumSelect labels={CONTRIBUTION_TYPE_LABELS} {...register('type')} />
        </FormField>
        <FormField id="c-date" label="Sana" required error={formState.errors.date?.message}>
          <Input type="date" {...register('date')} />
        </FormField>
        <FormField id="c-amount" label={`Summa${goal ? ` (${goal.currency})` : ''}`} required error={formState.errors.amount?.message}>
          <Input inputMode="decimal" autoFocus {...register('amount')} />
        </FormField>
        <FormField id="c-note" label="Izoh">
          <Input {...register('note')} />
        </FormField>
      </FormGrid>
    </FormDialog>
  )
}
