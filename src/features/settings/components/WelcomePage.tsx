import { DatabaseIcon, LockIcon, SparklesIcon, SquareDashedIcon } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMeta } from '@/hooks/useData'
import { settingsService } from '../service'

export function WelcomePage() {
  const meta = useMeta()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  if (meta.onboarded) return <Navigate to="/" replace />

  const start = (demo: boolean) => {
    if (settingsService.completeOnboarding(name, demo)) navigate('/', { replace: true })
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <SparklesIcon className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold">Personal OS</h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Maqsad → haftalik reja → kundalik harakat → natija → tahlil. Muhim narsalarni ko‘rinadigan qiling va har hafta real natijaga yaqinlashing.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-1.5">
          <Label htmlFor="welcome-name">Sizga qanday murojaat qilaylik? (ixtiyoriy)</Label>
          <Input id="welcome-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ismingiz" autoFocus />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => start(false)}
            className="flex flex-col items-start gap-2 rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <SquareDashedIcon className="size-5 text-primary" aria-hidden="true" />
            <span className="font-medium">Bo‘sh ish maydonidan boshlash</span>
            <span className="text-sm text-muted-foreground">O‘z maqsad va rejalaringizni noldan kiritasiz.</span>
          </button>
          <button
            type="button"
            onClick={() => start(true)}
            className="flex flex-col items-start gap-2 rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <DatabaseIcon className="size-5 text-primary" aria-hidden="true" />
            <span className="font-medium">Demo ma’lumotlar bilan tanishish</span>
            <span className="text-sm text-muted-foreground">Namuna maqsad, vazifa va moliya yozuvlari. Keyin Sozlamalardan bir tugma bilan o‘chiriladi.</span>
          </button>
        </div>

        <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs text-muted-foreground">
          <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Akkaunt yoki server yo‘q. Ma’lumotlar faqat shu brauzerda saqlanadi — zaxira uchun JSON eksportdan foydalaning.
        </p>
      </div>
    </main>
  )
}
