import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { countDemoRecords } from '@/data/seed/demo'
import { getDb } from '@/data/store'
import { goalService } from '@/features/goals/service'
import { settingsService } from '@/features/settings/service'
import { axeViolations, renderPage, resetDb } from '@/test/render'
import { DemoBanner } from './DemoBanner'

describe('DemoBanner', () => {
  beforeEach(() => {
    resetDb()
  })

  it('is hidden without demo records', () => {
    renderPage(<DemoBanner />)
    expect(screen.queryByText(/demo ma’lumotlarni ko‘ryapsiz/)).not.toBeInTheDocument()
  })

  it('clears only demo records after confirmation and disappears', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    settingsService.loadDemo()
    goalService.create({ title: 'O‘z maqsadim', description: '', status: 'active', metricType: 'completion', currentValue: 0 })
    const { container } = renderPage(<DemoBanner />)
    expect(await axeViolations(container)).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Demoni tozalash' }))
    await user.click(await screen.findByRole('button', { name: 'O‘chirish' }))

    expect(countDemoRecords(getDb())).toBe(0)
    expect(getDb().goals.map((g) => g.title)).toEqual(['O‘z maqsadim'])
    expect(screen.queryByText(/demo ma’lumotlarni ko‘ryapsiz/)).not.toBeInTheDocument()
  })
})
