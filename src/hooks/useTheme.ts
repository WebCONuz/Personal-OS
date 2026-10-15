import { useEffect, useSyncExternalStore } from 'react'
import { useProfile } from './useData'

export type ResolvedTheme = 'light' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'
/**
 * Copy of `profile.theme` in localStorage. Data lives in IndexedDB, which cannot be read
 * synchronously, so the inline script in index.html reads this key before first paint.
 */
export const THEME_HINT_KEY = 'personal-os:theme'
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
  const theme = useProfile().theme
  const resolved = useResolvedTheme()
  useEffect(() => {
    try {
      localStorage.setItem(THEME_HINT_KEY, theme)
    } catch {
      // Only costs a light flash on the next load.
    }
  }, [theme])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved])
  }, [resolved])
}
