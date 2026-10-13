import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '@/data/store'
import { goalService } from '@/features/goals/service'
import { createBackup } from '@/services/backup'
import { axeViolations, renderPage, resetDb } from '@/test/render'
import { SettingsPage } from './SettingsPage'

const file = (name: string, text: string) => new File([text], name, { type: 'application/json' })

describe('SettingsPage backup', () => {
  beforeEach(() => {
    resetDb()
    goalService.create({ title: 'Mavjud maqsad', description: '', status: 'active', metricType: 'completion', currentValue: 0 })
  })

  it('rejects a broken file and keeps current data', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = renderPage(<SettingsPage />, { route: '/settings' })
    expect(await axeViolations(container)).toEqual([])

    await user.upload(screen.getByLabelText('Zaxira faylini tanlash'), file('bad.json', '{oops'))
    expect(await screen.findByText(/JSON formatida emas/)).toBeInTheDocument()
    expect(getDb().goals.map((g) => g.title)).toEqual(['Mavjud maqsad'])
  })

  it('previews a valid backup and merges it after confirmation', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const incoming = { ...getDb(), goals: [{ ...getDb().goals[0], id: 'other', title: 'Fayldagi maqsad' }] }
    renderPage(<SettingsPage />, { route: '/settings' })

    await user.upload(screen.getByLabelText('Zaxira faylini tanlash'), file('backup.json', JSON.stringify(createBackup(incoming))))
    const dialog = await screen.findByRole('dialog', { name: 'Importni tasdiqlash' })
    expect(dialog).toHaveTextContent('Maqsadlar')
    expect(screen.getByRole('radio', { name: /Birlashtirish/ })).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Import qilish' }))
    expect(getDb().goals.map((g) => g.title).sort()).toEqual(['Fayldagi maqsad', 'Mavjud maqsad'])
  })
})
