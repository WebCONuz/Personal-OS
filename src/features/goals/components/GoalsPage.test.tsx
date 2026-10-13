import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '@/data/store'
import { axeViolations, renderPage, resetDb } from '@/test/render'
import { GoalFormDialog } from './GoalFormDialog'
import { GoalsPage } from './GoalsPage'

describe('GoalsPage', () => {
  beforeEach(() => {
    resetDb()
  })

  it('creates a goal through the form with inline validation', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = renderPage(<GoalsPage />, { route: '/goals', hosts: <GoalFormDialog /> })
    expect(await axeViolations(container)).toEqual([])

    await user.click(screen.getByRole('button', { name: /Birinchi maqsadni yaratish/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Yangi maqsad' })
    await user.click(within(dialog).getByRole('button', { name: 'Saqlash' }))

    expect(await within(dialog).findByText('Maqsad nomini kiriting')).toBeInTheDocument()
    expect(within(dialog).getByText('Sonli maqsad uchun target qiymatni kiriting')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Maqsad/, { selector: 'input' })).toHaveAttribute('aria-invalid', 'true')
    expect(await axeViolations(dialog)).toEqual([])

    await user.type(within(dialog).getByLabelText(/^Maqsad/, { selector: 'input' }), '12 ta kitob o‘qish')
    await user.type(within(dialog).getByLabelText(/Target qiymat/), '12')
    await user.click(within(dialog).getByRole('button', { name: 'Saqlash' }))

    expect(getDb().goals).toHaveLength(1)
    expect(getDb().goals[0]).toMatchObject({ title: '12 ta kitob o‘qish', targetValue: 12, metricType: 'numeric' })
    expect(await screen.findByRole('link', { name: '12 ta kitob o‘qish' })).toBeInTheDocument()
  })
})
