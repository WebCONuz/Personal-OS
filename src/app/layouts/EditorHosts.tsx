import { ConfirmHost } from '@/components/shared/confirm'
import {
  BudgetFormDialog,
  ContributionFormDialog,
  SavingsGoalFormDialog,
  TransactionFormDialog,
} from '@/features/finance/components/FinanceDialogs'
import { GoalFormDialog } from '@/features/goals/components/GoalFormDialog'
import { HabitFormDialog } from '@/features/habits/components/HabitFormDialog'
import { NoteFormDialog } from '@/features/knowledge/components/NoteFormDialog'
import { ProjectFormDialog } from '@/features/projects/components/ProjectFormDialog'
import { TaskFormDialog } from '@/features/tasks/components/TaskFormDialog'
import { TimeEntryFormDialog } from '@/features/time-tracking/components/TimeEntryFormDialog'
import { CareerDialogs } from '@/features/career/components/CareerDialogs'
import { BusinessDialogs } from '@/features/business/components/BusinessDialogs'
import { LearningDialogs } from '@/features/learning/components/LearningDialogs'
import { LifestyleDialogs } from '@/features/lifestyle/components/LifestyleDialogs'

/** All entity editors are mounted once, so any page or the quick-add menu can open them. */
export function EditorHosts() {
  return (
    <>
      <TaskFormDialog />
      <GoalFormDialog />
      <ProjectFormDialog />
      <HabitFormDialog />
      <NoteFormDialog />
      <TimeEntryFormDialog />
      <TransactionFormDialog />
      <BudgetFormDialog />
      <SavingsGoalFormDialog />
      <ContributionFormDialog />
      <CareerDialogs />
      <BusinessDialogs />
      <LearningDialogs />
      <LifestyleDialogs />
      <ConfirmHost />
    </>
  )
}
