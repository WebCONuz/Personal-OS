import { TRANSACTION_TYPE_LABELS } from '@/constants/labels'
import type { Project, Transaction } from '@/types'

function cell(value: string | number | undefined): string {
  const s = value === undefined ? '' : String(value)
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV with a UTF-8 BOM so spreadsheet apps read Uzbek characters correctly. */
export function transactionsToCsv(transactions: readonly Transaction[], projects: readonly Project[]): string {
  const header = ['Sana', 'Turi', 'Summa', 'Valyuta', 'Kategoriya', 'Izoh', 'Loyiha']
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      t.date,
      TRANSACTION_TYPE_LABELS[t.type],
      t.amount,
      t.currency,
      t.category,
      t.note,
      t.projectId ? projects.find((p) => p.id === t.projectId)?.title : undefined,
    ])
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\n')
}
