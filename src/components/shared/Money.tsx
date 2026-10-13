import { activeCurrencies, formatMoney, type CurrencyTotals } from '@/services/money'
import { cn } from '@/lib/utils'

/** Renders one line per currency. Currencies are never summed together. */
export function MoneyTotals({
  totals,
  className,
  signed,
  emptyLabel = '0',
}: {
  totals: CurrencyTotals
  className?: string
  signed?: boolean
  emptyLabel?: string
}) {
  const currencies = activeCurrencies(totals)
  if (currencies.length === 0) return <span className={cn('tabular', className)}>{emptyLabel}</span>
  return (
    <span className={cn('tabular flex flex-col', className)}>
      {currencies.map((c) => (
        <span key={c} className={cn(signed && totals[c] < 0 && 'text-destructive')}>
          {signed && totals[c] > 0 ? '+' : ''}
          {formatMoney(totals[c], c)}
        </span>
      ))}
    </span>
  )
}
