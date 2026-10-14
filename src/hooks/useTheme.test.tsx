import { act, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '@/data/store'
import { SettingsPage } from '@/features/settings/components/SettingsPage'
import { settingsService } from '@/features/settings/service'
import { renderPage, resetDb } from '@/test/render'
import { useThemeSync } from './useTheme'

describe('theme', () => {
  beforeEach(() => {
    resetDb()
    document.documentElement.classList.remove('dark')
  })

  it('new profiles follow the system theme', () => {
    expect(getDb().profile.theme).toBe('system')
  })

  it('applies and removes the dark class on <html>', () => {
    renderHook(() => useThemeSync())
    act(() => {
      settingsService.setTheme('dark')
    })
    expect(document.documentElement).toHaveClass('dark')
    act(() => {
      settingsService.setTheme('light')
    })
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('is chosen in settings and stored in the profile', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderPage(<SettingsPage />, { route: '/settings' })
    await user.click(screen.getByRole('radio', { name: /Qorong‘i/ }))
    expect(getDb().profile.theme).toBe('dark')
    expect(screen.getByRole('radio', { name: /Qorong‘i/ })).toBeChecked()
  })
})
