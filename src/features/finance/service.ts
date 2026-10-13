import { repos, type NewEntity } from '@/data/repositories'
import { notify } from '@/lib/notify'
import { getDb } from '@/data/store'
import { savedAmount } from '@/services/analytics'
import type { Budget, SavingsContribution, SavingsGoal, Transaction } from '@/types'

export type TransactionInput = NewEntity<Transaction>
export type BudgetInput = NewEntity<Budget>
export type SavingsGoalInput = NewEntity<SavingsGoal>
export type ContributionInput = NewEntity<SavingsContribution>

export const transactionService = {
  create(input: TransactionInput) {
    return repos.transactions.create(input, { success: input.type === 'income' ? 'Daromad qo‘shildi' : 'Xarajat qo‘shildi' })
  },
  update(id: string, patch: Partial<TransactionInput>) {
    return repos.transactions.update(id, patch, { success: 'Tranzaksiya yangilandi' })
  },
  remove(id: string) {
    return repos.transactions.remove(id, { success: 'Tranzaksiya o‘chirildi' })
  },
}

export const budgetService = {
  create(input: BudgetInput) {
    const duplicate = getDb().budgets.some((b) => b.category.toLowerCase() === input.category.toLowerCase() && b.currency === input.currency)
    if (duplicate) {
      notify.error('Budjet saqlanmadi', `“${input.category}” (${input.currency}) uchun budjet allaqachon mavjud — uni tahrirlang.`)
      return null
    }
    return repos.budgets.create(input, { success: 'Budjet qo‘shildi' })
  },
  update(id: string, patch: Partial<BudgetInput>) {
    return repos.budgets.update(id, patch, { success: 'Budjet yangilandi' })
  },
  remove(id: string) {
    return repos.budgets.remove(id, { success: 'Budjet o‘chirildi' })
  },
}

export const savingsService = {
  create(input: SavingsGoalInput) {
    return repos.savingsGoals.create(input, { success: 'Jamg‘arma maqsadi yaratildi' })
  },
  update(id: string, patch: Partial<SavingsGoalInput>) {
    return repos.savingsGoals.update(id, patch, { success: 'Jamg‘arma maqsadi yangilandi' })
  },
  remove(id: string) {
    return repos.savingsGoals.remove(id, { success: 'Jamg‘arma maqsadi va uning yozuvlari o‘chirildi' })
  },
  /** Contributions are the single source of the saved amount. Withdrawals cannot exceed the balance. */
  addContribution(input: ContributionInput) {
    if (input.type === 'withdrawal') {
      const balance = savedAmount(input.savingsGoalId, getDb().savingsContributions)
      if (input.amount > balance) {
        notify.error('Saqlanmadi', 'Yechib olinayotgan summa jamg‘armadagi qoldiqdan oshmasligi kerak.')
        return null
      }
    }
    return repos.savingsContributions.create(input, { success: input.type === 'deposit' ? 'Jamg‘armaga qo‘shildi' : 'Jamg‘armadan yechildi' })
  },
  removeContribution(id: string) {
    return repos.savingsContributions.remove(id, { success: 'Yozuv o‘chirildi' })
  },
}
