import { createEditorStore } from '@/lib/createEditorStore'
import type { Budget, SavingsContribution, SavingsGoal, Transaction } from '@/types'

export const useTransactionEditor = createEditorStore<Transaction>()
export const useBudgetEditor = createEditorStore<Budget>()
export const useSavingsEditor = createEditorStore<SavingsGoal>()
export const useContributionEditor = createEditorStore<SavingsContribution>()
