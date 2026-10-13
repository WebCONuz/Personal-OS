export const CURRENCIES = ['UZS', 'USD'] as const
export type Currency = (typeof CURRENCIES)[number]

/** Totals grouped by currency. UZS and USD are never added together (no exchange-rate service). */
export type CurrencyTotals = Record<Currency, number>

export function emptyTotals(): CurrencyTotals {
  return { UZS: 0, USD: 0 }
}

const GROUP = ' ' // narrow no-break space, Uzbek digit grouping
const formatters = new Map<number, Intl.NumberFormat>()

/**
 * Locale-stable number formatting (Uzbek convention: "1 250 000,5").
 * Browsers without `uz` locale data fall back to English separators, so separators are
 * normalised from Intl's parts instead of relying on locale data.
 */
export function formatNumber(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '—'
  let f = formatters.get(maxFractionDigits)
  if (!f) {
    f = new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits })
    formatters.set(maxFractionDigits, f)
  }
  return f
    .formatToParts(value)
    .map((p) => (p.type === 'group' ? GROUP : p.type === 'decimal' ? ',' : p.type === 'minusSign' ? '−' : p.value))
    .join('')
}

/** Short Uzbek magnitude form: 1,2 mlrd · 92 mln · 15 ming. */
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${formatNumber(value / 1e9, 1)} mlrd`
  if (abs >= 1e6) return `${formatNumber(value / 1e6, 1)} mln`
  if (abs >= 1e4) return `${formatNumber(value / 1e3, 0)} ming`
  return formatNumber(value, 0)
}

export function formatMoney(amount: number, currency: Currency, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(amount)) return '—'
  const num = opts.compact ? formatCompactNumber(amount) : formatNumber(amount, currency === 'UZS' ? 0 : 2)
  return currency === 'UZS' ? `${num} so‘m` : `${num} $`
}

export function sumByCurrency<T extends { amount: number; currency: Currency }>(
  items: readonly T[],
  sign: (item: T) => number = () => 1,
): CurrencyTotals {
  const totals = emptyTotals()
  for (const item of items) {
    totals[item.currency] += item.amount * sign(item)
  }
  return totals
}

/** Currencies with a non-zero value, keeping the default currency first. */
export function activeCurrencies(...totals: CurrencyTotals[]): Currency[] {
  return CURRENCIES.filter((c) => totals.some((t) => t[c] !== 0))
}

export function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
