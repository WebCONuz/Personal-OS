import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '@/data/store'
import { formatDateShort, formatWeekday, todayKey } from '@/services/date'
import { axeViolations, renderPage, resetDb } from '@/test/render'
import { habitService } from '../service'
import { HabitsPage } from './HabitsPage'

describe('HabitsPage', () => {
  beforeEach(() => {
    resetDb()
  })

  it('logs today once and shows the streak', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    habitService.create({ title: 'Ingliz tili', frequency: 'daily', targetPerWeek: 7, active: true })
    const { container } = renderPage(<HabitsPage />, { route: '/lifestyle' })
    const today = todayKey()
    const cell = screen.getByRole('checkbox', { name: `Ingliz tili: ${formatWeekday(today)}, ${formatDateShort(today)}` })

    await user.click(cell)
    expect(getDb().habitLogs).toHaveLength(1)
    expect(getDb().xpEvents).toHaveLength(1)

    await user.click(cell)
    await user.click(cell)
    expect(getDb().habitLogs).toHaveLength(1)
    expect(getDb().xpEvents).toHaveLength(1)
    expect(cell).toBeChecked()
    expect(await axeViolations(container)).toEqual([])
  })

  it('does not allow logging future days', () => {
    habitService.create({ title: 'Yurish', frequency: 'weekly', targetPerWeek: 3, active: true })
    renderPage(<HabitsPage />, { route: '/lifestyle' })
    const boxes = screen.getAllByRole('checkbox')
    const disabled = boxes.filter((b) => b.hasAttribute('disabled'))
    // Every day after today in the current week is disabled.
    const remaining = 6 - ((new Date().getDay() + 6) % 7)
    expect(disabled).toHaveLength(remaining)
  })
})
