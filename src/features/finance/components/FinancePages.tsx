import { DownloadIcon, MinusIcon, PencilIcon, PiggyBankIcon, PlusIcon, ReceiptIcon, SearchXIcon, Trash2Icon, WalletIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bars, CHART_COLORS } from '@/components/charts/Charts'
import { confirmDelete } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { MoneyTotals } from '@/components/shared/Money'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SAVINGS_STATUS_LABELS } from '@/constants/labels'
import { useCollection, useToday } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { budgetUsage, expenseByCategory, monthlyFinance, savedAmount, transactionsOfMonth } from '@/services/analytics'
import { formatDate, formatMonth, recentMonths, relativeDayLabel } from '@/services/date'
import { activeCurrencies, formatMoney, CURRENCIES, type Currency } from '@/services/money'
import { downloadBlob } from '@/services/backup'
import { percent } from '@/services/progress'
import { useBudgetEditor, useContributionEditor, useSavingsEditor, useTransactionEditor } from '../editor'
import { budgetService, savingsService, transactionService } from '../service'
import { transactionsToCsv } from '../csv'
import { MonthNavigator, useSelectedMonth } from './MonthNavigator'

const compact = (c: Currency) => (v: number) => formatMoney(v, c, { compact: true })

// ---------- Overview ----------

export function FinanceOverviewPage() {
  const [month, setMonth] = useSelectedMonth()
  const transactions = useCollection('transactions')
  const budgets = useCollection('budgets')
  const savingsGoals = useCollection('savingsGoals')
  const contributions = useCollection('savingsContributions')
  const openTx = useTransactionEditor((s) => s.openCreate)
  const summary = useMemo(() => monthlyFinance(transactions, month), [transactions, month])
  const currencies = activeCurrencies(summary.income, summary.expense)
  const months = recentMonths(month, 6)
  const usage = budgetUsage(budgets, transactions, month)

  if (transactions.length === 0 && savingsGoals.length === 0) {
    return (
      <EmptyState
        icon={WalletIcon}
        title="Moliyaviy yozuvlar yo‘q"
        description="Daromad va xarajatlarni kiritishni boshlang. UZS va USD alohida hisoblanadi — kurs xizmati yo‘q, summalar aralashtirilmaydi."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => openTx({ type: 'expense' })}><MinusIcon /> Xarajat</Button>
            <Button variant="outline" onClick={() => openTx({ type: 'income' })}><PlusIcon /> Daromad</Button>
          </div>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthNavigator month={month} onChange={setMonth} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openTx({ type: 'income' })}>
            <PlusIcon /> Daromad
          </Button>
          <Button onClick={() => openTx({ type: 'expense' })}>
            <MinusIcon /> Xarajat
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Daromad" value={<MoneyTotals totals={summary.income} />} />
        <StatCard label="Xarajat" value={<MoneyTotals totals={summary.expense} />} />
        <StatCard label="Sof farq" value={<MoneyTotals totals={summary.net} signed />} hint="Har bir valyuta alohida" />
      </div>

      {(currencies.length ? currencies : (['UZS'] as Currency[])).map((c) => {
        const data = months.map((m) => {
          const f = monthlyFinance(transactions, m)
          return { oy: formatMonth(m).split(' ')[0].slice(0, 3), daromad: f.income[c], xarajat: f.expense[c] }
        })
        const categories = expenseByCategory(transactions, month, c)
        return (
          <div key={c} className="grid gap-6 lg:grid-cols-5">
            <SectionCard title={`So‘nggi 6 oy · ${c}`} className="lg:col-span-3">
              <Bars
                caption={`So‘nggi 6 oy daromad va xarajat, ${c}`}
                data={data}
                xKey="oy"
                series={[
                  { key: 'daromad', label: 'Daromad', color: CHART_COLORS.primary },
                  { key: 'xarajat', label: 'Xarajat', color: CHART_COLORS.secondary },
                ]}
                formatter={compact(c)}
              />
            </SectionCard>
            <SectionCard title={`Xarajat kategoriyalari · ${c}`} className="lg:col-span-2">
              {categories.length ? (
                <Bars
                  caption={`Xarajatlar kategoriya bo‘yicha, ${c}`}
                  data={categories.slice(0, 7).map((x) => ({ kategoriya: x.category, summa: x.amount }))}
                  xKey="kategoriya"
                  series={[{ key: 'summa', label: 'Xarajat', color: CHART_COLORS.secondary }]}
                  layout="vertical"
                  formatter={compact(c)}
                  height={Math.max(140, Math.min(7, categories.length) * 34)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Bu oy {c} xarajati yo‘q.</p>
              )}
            </SectionCard>
          </div>
        )
      })}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Budjet holati" description={formatMonth(month)}>
          {usage.length ? (
            <ul className="flex flex-col gap-3">
              {usage.map((u) => (
                <li key={u.budget.id}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span>{u.budget.category}</span>
                    <span className={cn('tabular text-muted-foreground', u.exceeded && 'text-destructive')}>
                      {formatMoney(u.spent, u.budget.currency)} / {formatMoney(u.budget.amount, u.budget.currency)}
                    </span>
                  </div>
                  <ProgressBar value={u.percent} tone={u.exceeded ? 'destructive' : u.percent >= 80 ? 'warning' : 'default'} label={`${u.budget.category} budjeti`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Budjet limitlari belgilanmagan. “Budjet” bo‘limida qo‘shing.</p>
          )}
        </SectionCard>
        <SectionCard title="Jamg‘arma maqsadlari">
          {savingsGoals.filter((g) => g.status === 'active').length ? (
            <ul className="flex flex-col gap-3">
              {savingsGoals
                .filter((g) => g.status === 'active')
                .map((g) => {
                  const saved = savedAmount(g.id, contributions)
                  return (
                    <li key={g.id}>
                      <div className="mb-1 flex justify-between gap-2 text-sm">
                        <span className="truncate">{g.title}</span>
                        <span className="tabular shrink-0 text-muted-foreground">
                          {formatMoney(saved, g.currency, { compact: true })} / {formatMoney(g.targetAmount, g.currency, { compact: true })}
                        </span>
                      </div>
                      <ProgressBar value={percent(saved, g.targetAmount)} label={`${g.title} jamg‘armasi`} />
                    </li>
                  )
                })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Faol jamg‘arma maqsadi yo‘q.</p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// ---------- Transactions ----------

export function TransactionsPage() {
  const [month, setMonth] = useSelectedMonth()
  const transactions = useCollection('transactions')
  const projects = useCollection('projects')
  const openCreate = useTransactionEditor((s) => s.openCreate)
  const openEdit = useTransactionEditor((s) => s.openEdit)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all')
  const [currency, setCurrency] = useState<'all' | Currency>('all')
  const [category, setCategory] = useState('all')

  const monthList = useMemo(() => transactionsOfMonth(transactions, month), [transactions, month])
  const categories = [...new Set(monthList.map((t) => t.category))].sort()
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return monthList
      .filter(
        (t) =>
          (type === 'all' || t.type === type) &&
          (currency === 'all' || t.currency === currency) &&
          (category === 'all' || t.category === category) &&
          (!q || t.category.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q)),
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [monthList, query, type, currency, category])
  const totals = monthlyFinance(rows, month)

  const exportCsv = () => {
    downloadBlob(`personal-os-tranzaksiyalar-${month}.csv`, new Blob([transactionsToCsv(rows, projects)], { type: 'text/csv;charset=utf-8' }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthNavigator month={month} onChange={setMonth} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <DownloadIcon /> CSV
          </Button>
          <Button onClick={() => openCreate()}>
            <PlusIcon /> Tranzaksiya
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchInput value={query} onChange={setQuery} placeholder="Kategoriya yoki izoh…" />
        <FilterSelect label="Turi" value={type} onChange={setType} options={[{ value: 'all', label: 'Barchasi' }, { value: 'income', label: 'Daromad' }, { value: 'expense', label: 'Xarajat' }]} />
        <FilterSelect label="Valyuta" value={currency} onChange={setCurrency} options={[{ value: 'all', label: 'Barcha valyutalar' }, ...CURRENCIES.map((c) => ({ value: c, label: c }))]} />
        <FilterSelect label="Kategoriya" value={category} onChange={setCategory} options={[{ value: 'all', label: 'Barcha kategoriyalar' }, ...categories.map((c) => ({ value: c, label: c }))]} />
      </div>

      {monthList.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title={`${formatMonth(month)} uchun tranzaksiya yo‘q`}
          description="Daromad yoki xarajat qo‘shing."
          action={<Button onClick={() => openCreate()}><PlusIcon /> Tranzaksiya qo‘shish</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState compact icon={SearchXIcon} title="Mos tranzaksiya topilmadi" description="Filtrlarni o‘zgartiring." />
      ) : (
        <>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">Tanlangan: {rows.length} ta</span>
            <span className="flex gap-1">Daromad: <MoneyTotals totals={totals.income} className="font-medium" /></span>
            <span className="flex gap-1">Xarajat: <MoneyTotals totals={totals.expense} className="font-medium" /></span>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {rows.map((t) => {
                const project = t.projectId ? projects.find((p) => p.id === t.projectId) : undefined
                return (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.category}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(t.date, 'd MMM')}
                        {t.note && ` · ${t.note}`}
                        {project && ` · ${project.title}`}
                      </p>
                    </div>
                    <span className={cn('tabular text-sm font-medium', t.type === 'income' ? 'text-success' : 'text-foreground')}>
                      {t.type === 'income' ? '+' : '−'}
                      {formatMoney(t.amount, t.currency)}
                    </span>
                    <Button variant="ghost" size="icon-xs" aria-label="Tahrirlash" onClick={() => openEdit(t)}>
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="O‘chirish"
                      onClick={async () => {
                        if (await confirmDelete('Tranzaksiya')) transactionService.remove(t.id)
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Budgets ----------

export function BudgetsPage() {
  const [month, setMonth] = useSelectedMonth()
  const budgets = useCollection('budgets')
  const transactions = useCollection('transactions')
  const openCreate = useBudgetEditor((s) => s.openCreate)
  const openEdit = useBudgetEditor((s) => s.openEdit)
  const usage = budgetUsage(budgets, transactions, month)

  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={WalletIcon}
        title="Budjet limitlari yo‘q"
        description="Asosiy xarajat kategoriyalari uchun oylik limit belgilang — real xarajat bilan avtomatik solishtiriladi."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Limit qo‘shish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthNavigator month={month} onChange={setMonth} />
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Limit
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {usage.map((u) => (
          <Card key={u.budget.id} className="gap-3 px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{u.budget.category}</p>
                <p className="tabular text-xs text-muted-foreground">Limit: {formatMoney(u.budget.amount, u.budget.currency)} / oy</p>
              </div>
              <div className="flex">
                <Button variant="ghost" size="icon-sm" aria-label="Tahrirlash" onClick={() => openEdit(u.budget)}>
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="O‘chirish"
                  onClick={async () => {
                    if (await confirmDelete('Budjet limiti')) budgetService.remove(u.budget.id)
                  }}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <ProgressBar value={u.percent} tone={u.exceeded ? 'destructive' : u.percent >= 80 ? 'warning' : 'default'} label={`${u.budget.category} budjeti`} />
            <p className={cn('tabular text-sm', u.exceeded ? 'text-destructive' : 'text-muted-foreground')}>
              {u.exceeded
                ? `Limitdan ${formatMoney(-u.remaining, u.budget.currency)} oshdi`
                : `Sarflandi ${formatMoney(u.spent, u.budget.currency)} · qoldi ${formatMoney(u.remaining, u.budget.currency)}`}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------- Savings ----------

export function SavingsPage() {
  const goals = useCollection('savingsGoals')
  const contributions = useCollection('savingsContributions')
  const today = useToday()
  const openCreate = useSavingsEditor((s) => s.openCreate)
  const openEdit = useSavingsEditor((s) => s.openEdit)
  const openContribution = useContributionEditor((s) => s.openCreate)

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={PiggyBankIcon}
        title="Jamg‘arma maqsadlari yo‘q"
        description="Uy, avtomobil yoki zaxira fondi uchun maqsad yarating. Yig‘ilgan summa faqat siz qo‘shgan hissa yozuvlaridan hisoblanadi."
        action={<Button onClick={() => openCreate()}><PlusIcon /> Maqsad yaratish</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Jamg‘armaga o‘tkazmalar daromad/xarajat hisobiga qo‘shilmaydi — bitta pul ikki marta hisoblanmaydi.</p>
        <Button onClick={() => openCreate()}>
          <PlusIcon /> Jamg‘arma maqsadi
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((g) => {
          const saved = savedAmount(g.id, contributions)
          const history = contributions.filter((c) => c.savingsGoalId === g.id).sort((a, b) => b.date.localeCompare(a.date))
          const p = percent(saved, g.targetAmount)
          return (
            <SectionCard
              key={g.id}
              title={g.title}
              description={g.targetDate ? `Maqsad sanasi: ${formatDate(g.targetDate, 'd MMMM yyyy')} (${relativeDayLabel(g.targetDate, today)})` : undefined}
              action={
                <div className="flex">
                  <Button variant="ghost" size="icon-sm" aria-label="Tahrirlash" onClick={() => openEdit(g)}>
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="O‘chirish"
                    onClick={async () => {
                      if (await confirmDelete('Jamg‘arma maqsadi', 'Maqsad va uning barcha hissa yozuvlari o‘chiriladi.')) savingsService.remove(g.id)
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              }
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="tabular text-2xl font-semibold">{formatMoney(saved, g.currency)}</span>
                  <span className="tabular text-sm text-muted-foreground">/ {formatMoney(g.targetAmount, g.currency)}</span>
                </div>
                <ProgressBar value={p} tone={p >= 100 ? 'success' : 'default'} label={`${g.title} progressi`} />
                <div className="flex flex-wrap items-center gap-2">
                  {g.status !== 'active' && <StatusBadge tone="muted">{SAVINGS_STATUS_LABELS[g.status]}</StatusBadge>}
                  <Button size="sm" onClick={() => openContribution({ savingsGoalId: g.id, type: 'deposit' })}>
                    <PlusIcon /> Qo‘shish
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openContribution({ savingsGoalId: g.id, type: 'withdrawal' })} disabled={saved <= 0}>
                    <MinusIcon /> Yechish
                  </Button>
                </div>
                {history.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Tarix ({history.length})</summary>
                    <ul className="mt-2 divide-y rounded-lg border">
                      {history.map((c) => (
                        <li key={c.id} className="flex items-center gap-3 px-3 py-1.5">
                          <span className="w-16 text-xs text-muted-foreground">{formatDate(c.date, 'd MMM')}</span>
                          <span className={cn('tabular flex-1', c.type === 'deposit' ? 'text-success' : 'text-foreground')}>
                            {c.type === 'deposit' ? '+' : '−'}
                            {formatMoney(c.amount, g.currency)}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">{c.note}</span>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Yozuvni o‘chirish"
                            onClick={async () => {
                              if (await confirmDelete('Hissa yozuvi')) savingsService.removeContribution(c.id)
                            }}
                          >
                            <Trash2Icon />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </SectionCard>
          )
        })}
      </div>
    </div>
  )
}
