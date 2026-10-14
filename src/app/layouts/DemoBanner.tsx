import { DatabaseIcon } from 'lucide-react'
import { confirm } from '@/components/shared/confirm'
import { Button } from '@/components/ui/button'
import { countDemoRecords } from '@/data/seed/demo'
import { useDb } from '@/data/store'
import { settingsService } from '@/features/settings/service'

/** Shown while demo records exist, so the way back to a clean workspace is always one click away. */
export function DemoBanner() {
  const hasDemo = useDb((s) => countDemoRecords(s.data) > 0)
  if (!hasDemo) return null

  const clear = async () => {
    if (
      await confirm({
        title: 'Demo ma’lumotlar o‘chirilsinmi?',
        description: 'Faqat demo yozuvlar o‘chiriladi. O‘zingiz qo‘shgan yozuvlar saqlanadi, demo yozuvlarga bog‘lanishi uziladi.',
        confirmLabel: 'O‘chirish',
        destructive: true,
      })
    ) {
      settingsService.clearDemo()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-primary/5 px-4 py-2.5 text-sm lg:px-6" role="status">
      <DatabaseIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="flex-1">Siz demo ma’lumotlarni ko‘ryapsiz. Tayyor bo‘lsangiz, ularni tozalab o‘z yozuvlaringiz bilan davom eting.</p>
      <Button size="sm" variant="outline" onClick={clear}>
        Demoni tozalash
      </Button>
    </div>
  )
}
