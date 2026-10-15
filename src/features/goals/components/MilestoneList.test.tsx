import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '@/data/store'
import { axeViolations, renderPage, resetDb } from '@/test/render'
import { milestoneService } from '../service'
import { MilestoneList } from './MilestoneList'

describe('MilestoneList editing', () => {
  beforeEach(() => {
    resetDb()
    milestoneService.create({ title: '1-bosqich', targetDate: '2026-11-15', description: 'Izoh', goalId: 'g1' })
  })

  it('edits title and date inline, keeping the description', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = renderPage(<MilestoneList goalId="g1" />)

    await user.click(screen.getByRole('button', { name: '“1-bosqich” bosqichini tahrirlash' }))
    expect(await axeViolations(container)).toEqual([])
    const form = screen.getByRole('form', { name: '“1-bosqich” bosqichini tahrirlash' })
    const title = form.querySelector('input:not([type=date])') as HTMLInputElement
    const date = form.querySelector('input[type=date]') as HTMLInputElement
    await user.clear(title)
    await user.type(title, 'Birinchi natija')
    await user.clear(date)
    await user.click(screen.getByRole('button', { name: 'Saqlash' }))

    const [m] = getDb().milestones
    expect(m).toMatchObject({ title: 'Birinchi natija', description: 'Izoh' })
    expect(m.targetDate).toBeUndefined()
    expect(screen.getByText('Birinchi natija')).toBeInTheDocument()
  })

  it('rejects an empty title and cancels with Escape', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderPage(<MilestoneList goalId="g1" />)

    await user.click(screen.getByRole('button', { name: '“1-bosqich” bosqichini tahrirlash' }))
    const form = screen.getByRole('form', { name: '“1-bosqich” bosqichini tahrirlash' })
    const title = form.querySelector('input:not([type=date])') as HTMLInputElement
    await user.clear(title)
    await user.click(screen.getByRole('button', { name: 'Saqlash' }))
    expect(await screen.findByText('Bosqich nomini kiriting')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('form', { name: '“1-bosqich” bosqichini tahrirlash' })).not.toBeInTheDocument()
    expect(getDb().milestones[0].title).toBe('1-bosqich')
  })
})
