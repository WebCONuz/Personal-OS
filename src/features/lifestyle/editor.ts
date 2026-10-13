import { createEditorStore } from '@/lib/createEditorStore'
import type { FamilyEvent, HealthLog } from '@/types'

export const useHealthEditor = createEditorStore<HealthLog>()
export const useFamilyEditor = createEditorStore<FamilyEvent>()
