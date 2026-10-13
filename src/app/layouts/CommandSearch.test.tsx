import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { goalService } from '@/features/goals/service'
import { axeViolations, renderPage, resetDb } from '@/test/render'
import { CommandSearch } from './CommandSearch'

describe('CommandSearch', () => {
  beforeEach(() => {
    resetDb()
    goalService.create({ title: 'Uy uchun jamg‘arma', description: '', status: 'active', metricType: 'completion', currentValue: 0 })
  })

  // Regression: cmdk parts rendered outside <Command> crashed the whole app on Ctrl+K.
  it('opens with Ctrl+K and finds entities', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderPage(<CommandSearch />)
    await user.keyboard('{Control>}k{/Control}')
    const input = await screen.findByPlaceholderText('Qidirish…')
    await user.type(input, 'jamg')
    expect(await screen.findByText('Uy uchun jamg‘arma')).toBeInTheDocument()
    expect(await axeViolations(screen.getByRole('dialog'))).toEqual([])
  })
})
