import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createMemoryAdapter } from '@/data/storage/adapter'
import { getDb, reloadDb } from '@/data/store'
import { TasksPage } from './TasksPage'

function renderPage(path = '/planning/tasks') {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <TasksPage />
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('TasksPage', () => {
  beforeEach(() => reloadDb(createMemoryAdapter()))

  it('shows an actionable empty state', () => {
    renderPage()
    expect(screen.getByText('Vazifalar yo‘q')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Vazifa qo‘shish/ })).toBeInTheDocument()
  })

  it('captures a task into the inbox and lets the user complete it', async () => {
    const user = userEvent.setup()
    renderPage('/planning/tasks?view=inbox')
    await user.type(screen.getByRole('textbox', { name: 'Inbox’ga yangi vazifa' }), 'Docker sozlash{Enter}')

    expect(await screen.findByText('Docker sozlash')).toBeInTheDocument()
    expect(getDb().tasks).toHaveLength(1)

    await user.click(screen.getByRole('checkbox', { name: /bajarilgan deb belgilash/ }))
    expect(getDb().tasks[0].status).toBe('done')
    // Done tasks leave the inbox view.
    expect(screen.queryByText('Docker sozlash')).not.toBeInTheDocument()
  })

  it('filters by search text and offers to clear filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('textbox', { name: 'Inbox’ga yangi vazifa' }), 'Birinchi{Enter}')
    await user.type(screen.getByRole('searchbox', { name: 'Qidirish' }), 'mavjud emas')
    expect(screen.getByText('Mos vazifa topilmadi')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Filtrlarni tozalash' }))
    expect(screen.getByText('Birinchi')).toBeInTheDocument()
  })
})
