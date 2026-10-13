import { create } from 'zustand'

export interface EditorState<E, D> {
  open: boolean
  entity: E | null
  defaults: D | null
  openCreate: (defaults?: D) => void
  openEdit: (entity: E) => void
  close: () => void
}

/**
 * Global open/close state for an entity form dialog, so any page (or the quick-add menu)
 * can open the same editor without prop drilling.
 */
export function createEditorStore<E, D = Partial<E>>() {
  return create<EditorState<E, D>>()((set) => ({
    open: false,
    entity: null,
    defaults: null,
    openCreate: (defaults) => set({ open: true, entity: null, defaults: defaults ?? null }),
    openEdit: (entity) => set({ open: true, entity, defaults: null }),
    close: () => set({ open: false }),
  }))
}
