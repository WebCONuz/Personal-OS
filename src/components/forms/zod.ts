import { z } from 'zod'
import { isValidDateKey } from '@/services/date'

/**
 * Form-level field schemas. Inputs are always strings (what DOM inputs produce);
 * outputs are domain values (`undefined` for empty optional fields, numbers for numeric fields).
 */

export const requiredText = (message = 'Bu maydon majburiy') => z.string().trim().min(1, message)

export const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))

export const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Havola http:// yoki https:// bilan boshlanishi kerak')
  .transform((v) => (v === '' ? undefined : v))

export const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === '' || isValidDateKey(v), 'Sana noto‘g‘ri')
  .transform((v) => (v === '' ? undefined : v))

export const requiredDate = z.string().trim().refine(isValidDateKey, 'Sanani tanlang')

type NumberCheck = (n: number) => string | null

function parseNumber(v: string): number {
  return Number(v.replace(/\s/g, '').replace(',', '.'))
}

export function optionalNumber(check?: NumberCheck) {
  return z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') return undefined
      const n = parseNumber(v)
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: 'custom', message: 'Son kiriting' })
        return z.NEVER
      }
      const error = check?.(n)
      if (error) {
        ctx.addIssue({ code: 'custom', message: error })
        return z.NEVER
      }
      return n
    })
}

export function requiredNumber(check?: NumberCheck, message = 'Qiymatni kiriting') {
  return z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') {
        ctx.addIssue({ code: 'custom', message })
        return z.NEVER
      }
      const n = parseNumber(v)
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: 'custom', message: 'Son kiriting' })
        return z.NEVER
      }
      const error = check?.(n)
      if (error) {
        ctx.addIssue({ code: 'custom', message: error })
        return z.NEVER
      }
      return n
    })
}

export const checks = {
  positive: (n: number) => (n > 0 ? null : 'Musbat son bo‘lishi kerak'),
  nonNegative: (n: number) => (n >= 0 ? null : 'Manfiy bo‘lmasligi kerak'),
  positiveInt: (n: number) => (Number.isInteger(n) && n > 0 ? null : 'Musbat butun son bo‘lishi kerak'),
  range: (min: number, max: number) => (n: number) => (n >= min && n <= max ? null : `${min} dan ${max} gacha bo‘lishi kerak`),
  intRange: (min: number, max: number) => (n: number) =>
    Number.isInteger(n) && n >= min && n <= max ? null : `${min} dan ${max} gacha butun son bo‘lishi kerak`,
}

/** Converts optional domain values back into form strings. */
export function str(value: string | number | undefined | null): string {
  return value === undefined || value === null ? '' : String(value)
}
