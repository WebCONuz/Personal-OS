import { notify } from '@/lib/notify'
import { nowIso } from '@/lib/id'
import { mutate } from '@/data/mutate'
import { repos } from '@/data/repositories'
import { countDemoRecords, withDemoData, withoutDemoData } from '@/data/seed/demo'
import { StorageError, toStorageError } from '@/data/storage/adapter'
import { estimateUsageBytes, listRecoveryKeys } from '@/data/storage/persistence'
import { flushWrites, getDb, getStorageAdapter, useDb } from '@/data/store'
import { applyImport, backupFileName, createBackup, downloadBlob, downloadJson, parseBackup, type ImportPreview, type ImportStrategy } from '@/services/backup'
import { todayKey } from '@/services/date'
import type { Profile, Theme } from '@/types'

function storageErrorToast(title: string, error: unknown) {
  const e = error instanceof StorageError ? error : toStorageError(error)
  notify.error(title, e.message)
}

export const settingsService = {
  updateProfile(patch: Partial<Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>>, success = 'Sozlamalar saqlandi') {
    return mutate((s) => ({ profile: { ...s.profile, ...patch, updatedAt: nowIso() } }), { success })
  },

  /** No toast: the theme change itself is the feedback. */
  setTheme(theme: Theme) {
    return mutate((s) => ({ profile: { ...s.profile, theme, updatedAt: nowIso() } }))
  },

  setLifeAreaActive(id: string, isActive: boolean) {
    return repos.lifeAreas.update(id, { isActive }, { success: isActive ? 'Soha faollashtirildi' : 'Soha yashirildi' })
  },

  renameLifeArea(id: string, name: string) {
    if (!name.trim()) return false
    return repos.lifeAreas.update(id, { name: name.trim() }, { success: 'Soha nomi yangilandi' })
  },

  /** All collections come from one store snapshot, so the backup is internally consistent. */
  exportBackup() {
    const backup = createBackup(getDb())
    downloadJson(backupFileName(), backup)
    try {
      useDb.getState().updateMeta({ lastExportAt: backup.exportedAt })
    } catch {
      // The file was already downloaded; failing to store the timestamp is not critical.
    }
    notify.success('Zaxira fayli yuklab olindi')
  },

  previewImport(text: string): ImportPreview {
    return parseBackup(text, getDb())
  },

  /** Validated data is applied atomically; on failure the current data stays untouched. */
  applyImport(preview: ImportPreview, strategy: ImportStrategy) {
    try {
      const next = applyImport(getDb(), preview.data, strategy)
      useDb.getState().replaceAll(next, { onboarded: true })
      notify.success(strategy === 'replace' ? 'Ma’lumotlar almashtirildi' : 'Ma’lumotlar birlashtirildi')
      return true
    } catch (error) {
      storageErrorToast('Import bajarilmadi — mavjud ma’lumotlar o‘zgarmadi', error)
      return false
    }
  },

  loadDemo() {
    try {
      useDb.getState().replaceAll(withDemoData(getDb(), todayKey()), { demoLoaded: true, onboarded: true })
      notify.success('Demo ma’lumotlar qo‘shildi')
      return true
    } catch (error) {
      storageErrorToast('Demo yuklanmadi', error)
      return false
    }
  },

  clearDemo() {
    const count = countDemoRecords(getDb())
    try {
      useDb.getState().replaceAll(withoutDemoData(getDb()), { demoLoaded: false })
      notify.success(`${count} ta demo yozuv o‘chirildi`)
      return true
    } catch (error) {
      storageErrorToast('Demo tozalanmadi', error)
      return false
    }
  },

  resetAll() {
    try {
      useDb.getState().resetAll()
      notify.success('Barcha ma’lumotlar o‘chirildi')
      return true
    } catch (error) {
      storageErrorToast('Tozalab bo‘lmadi', error)
      return false
    }
  },

  completeOnboarding(displayName: string, withDemo: boolean) {
    const name = displayName.trim().slice(0, 60)
    try {
      const state = getDb()
      const base = { ...state, profile: { ...state.profile, displayName: name, updatedAt: nowIso() } }
      const next = withDemo ? withDemoData(base, todayKey()) : base
      useDb.getState().replaceAll(next, { onboarded: true, demoLoaded: withDemo })
      return true
    } catch (error) {
      storageErrorToast('Boshlashning imkoni bo‘lmadi', error)
      return false
    }
  },

  storageInfo() {
    const adapter = getStorageAdapter()
    return { usageBytes: estimateUsageBytes(adapter), recoveryKeys: listRecoveryKeys(adapter) }
  },

  /** Same as storageInfo, after background saves have finished (the stored snapshot is then current). */
  async refreshStorageInfo() {
    await flushWrites()
    return settingsService.storageInfo()
  },

  downloadRecovery(key: string) {
    const raw = getStorageAdapter().getItem(key)
    if (raw === null) return notify.error('Zaxira topilmadi')
    downloadBlob(`${key.replace(/[^a-z0-9-]+/gi, '_')}.json`, new Blob([raw], { type: 'application/json' }))
  },

  async deleteRecovery(key: string) {
    try {
      await getStorageAdapter().write([{ key, value: null }])
      notify.success('Zaxira nusxa o‘chirildi')
    } catch (error) {
      storageErrorToast('O‘chirib bo‘lmadi', error)
    }
  },
}
