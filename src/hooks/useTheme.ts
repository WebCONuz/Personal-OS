import { useEffect, useSyncExternalStore } from 'react'
import { useProfile } from './useData'

export type ResolvedTheme = 'light' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'
// Mirrors --background / --sidebar of each theme so the browser chrome (mobile address bar) matches.
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#fbfbfc', dark: '#17212b' }

function subscribeSystem(onChange: () => void) {
  const query = window.matchMedia?.(DARK_QUERY)
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}

function systemPrefersDark() {
  return window.matchMedia?.(DARK_QUERY).matches ?? false
}

/** The theme actually shown: `system` follows the OS setting live. */
export function useResolvedTheme(): ResolvedTheme {
  const theme = useProfile().theme
  const systemDark = useSyncExternalStore(subscribeSystem, systemPrefersDark, () => false)
  if (theme === 'system') return systemDark ? 'dark' : 'light'
  return theme
}

/**
 * Applies the resolved theme to <html>. Mounted once at the app root; the inline script in
 * index.html does the same before first paint so a dark theme never flashes light.
 */
export function useThemeSync() {
  const resolved = useResolvedTheme()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved])
  }, [resolved])
}
