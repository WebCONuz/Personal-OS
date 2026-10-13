import { render } from '@testing-library/react'
import axe from 'axe-core'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ConfirmHost } from '@/components/shared/confirm'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createMemoryAdapter } from '@/data/storage/adapter'
import { reloadDb } from '@/data/store'

/** Fresh in-memory database for each test. */
export function resetDb() {
  const adapter = createMemoryAdapter()
  reloadDb(adapter)
  return adapter
}

/** Renders a page inside router + providers, plus extra hosts (form dialogs) it relies on. */
export function renderPage(ui: ReactElement, opts: { route?: string; path?: string; hosts?: ReactElement } = {}) {
  const route = opts.route ?? '/'
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={opts.path ?? '*'} element={ui} />
        </Routes>
      </MemoryRouter>
      {opts.hosts}
      <ConfirmHost />
    </TooltipProvider>,
  )
}

/**
 * axe accessibility check for jsdom. Colour contrast and landmark rules need real layout /
 * full page shell, so they are verified in the browser instead.
 */
export async function axeViolations(container: Element) {
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    resultTypes: ['violations'],
  })
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 80)).join(' | ')}`)
}
