import { describe, expect, it } from 'vitest'
import { activeCurrencies, formatCompactNumber, formatMoney, formatNumber, sumByCurrency } from './index'

describe('money', () => {
  it('formats numbers with Uzbek separators regardless of browser locale data', () => {
    expect(formatNumber(1250000.5)).toBe('1 250 000,5')
    expect(formatNumber(-42)).toBe('−42')
    expect(formatMoney(18_000_000, 'UZS')).toBe('18 000 000 so‘m')
    expect(formatMoney(29, 'USD')).toBe('29 $')
    expect(formatMoney(29.5, 'USD')).toBe('29,5 $')
  })

  it('uses Uzbek magnitude words for compact values', () => {
    expect(formatCompactNumber(92_000_000)).toBe('92 mln')
    expect(formatCompactNumber(1_200_000_000)).toBe('1,2 mlrd')
    expect(formatCompactNumber(15_000)).toBe('15 ming')
    expect(formatCompactNumber(950)).toBe('950')
  })

  it('never adds UZS and USD together', () => {
    const totals = sumByCurrency([
      { amount: 100_000, currency: 'UZS' as const },
      { amount: 50, currency: 'USD' as const },
      { amount: 200_000, currency: 'UZS' as const },
    ])
    expect(totals).toEqual({ UZS: 300_000, USD: 50 })
  })

  it('lists only currencies that have values', () => {
    expect(activeCurrencies({ UZS: 0, USD: 10 })).toEqual(['USD'])
    expect(activeCurrencies({ UZS: 5, USD: 0 }, { UZS: 0, USD: -3 })).toEqual(['UZS', 'USD'])
  })
})
