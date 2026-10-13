import { create } from 'zustand'

/**
 * Per-device UI conveniences (not user data): kept separate from the data store,
 * never exported/imported, and safe to lose.
 */
const KEY = 'personal-os:ui'

interface UiPrefs {
  sidebarCollapsed: boolean
}

function read(): UiPrefs {
  try {
    const raw = globalThis.localStorage?.getItem(KEY)
    if (raw) return { sidebarCollapsed: false, ...(JSON.parse(raw) as Partial<UiPrefs>) }
  } catch {
    // ignore — defaults are fine
  }
  return { sidebarCollapsed: false }
}

function write(prefs: UiPrefs) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // ignore — a UI preference is not worth an error toast
  }
}

export const useUiPrefs = create<UiPrefs & { toggleSidebar: () => void }>()((set, get) => ({
  ...read(),
  toggleSidebar: () => {
    const next = { sidebarCollapsed: !get().sidebarCollapsed }
    write(next)
    set(next)
  },
}))
