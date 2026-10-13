import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '@/data/store'
import { taskService } from '@/features/tasks/service'
import { startOfWeekKey, todayKey } from '@/services/date'
import { axeViolations, renderPage, resetDb } from '@/test/render'
import { WeeklyPlanPage } from './WeeklyPlanPage'

describe('WeeklyPlanPage', () => {
  beforeEach(() => {
    resetDb()
  })

  it('creates a draft plan, starts it and adds a priority', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = renderPage(<WeeklyPlanPage />, { route: '/planning' })

    await user.click(screen.getByRole('button', { name: 'Haftani rejalashtirish' }))
    expect(getDb().weeklyPlans[0].status).toBe('draft')
    expect(screen.getByText('Qoralama')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Rejani boshlash/ }))
    expect(getDb().weeklyPlans[0].status).toBe('active')

    await user.type(screen.getByRole('textbox', { name: 'Yangi ustuvor natija' }), 'Portfolio saytini chiqarish')
    await user.click(screen.getByRole('button', { name: /Qo‘shish/ }))
    expect(getDb().weeklyPlans[0].priorities.map((p) => p.title)).toEqual(['Portfolio saytini chiqarish'])
    expect(await axeViolations(container)).toEqual([])
  })

  it('warns when the plan exceeds capacity minus buffer', async () => {
    const week = startOfWeekKey(todayKey())
    // Default capacity 600 min with 20% buffer → 480 min plannable.
    for (const title of ['A', 'B', 'C']) {
      taskService.create({ title, description: '', status: 'todo', priority: 'medium', weekStart: week, estimatedMinutes: 200 }, { silent: true })
    }
    renderPage(<WeeklyPlanPage />, { route: '/planning' })
    expect(await screen.findByText(/Reja mavjud vaqtdan 2 soat ga katta/)).toBeInTheDocument()
  })
})
