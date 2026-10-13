import { AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CapacityInfo } from '@/services/analytics'
import { formatMinutes, type DateKey } from '@/services/date'
import type { WeeklyPlan } from '@/types'
import { weeklyPlanService } from '../service'

export function CapacityCard({ week, plan, capacity }: { week: DateKey; plan?: WeeklyPlan; capacity: CapacityInfo }) {
  const [editing, setEditing] = useState(false)
  const [hours, setHours] = useState('')
  const [buffer, setBuffer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bufferPercent = plan?.bufferPercent ?? 0

  const startEdit = () => {
    setHours(String(Math.round((capacity.capacity / 60) * 10) / 10))
    setBuffer(String(plan?.bufferPercent ?? 20))
    setError(null)
    setEditing(true)
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    const h = Number(hours.replace(',', '.'))
    const b = Number(buffer)
    if (!Number.isFinite(h) || h < 0 || h > 168) return setError('Soat 0 dan 168 gacha bo‘lishi kerak')
    if (!Number.isInteger(b) || b < 0 || b > 80) return setError('Buffer 0–80% oralig‘ida butun son bo‘lsin')
    if (weeklyPlanService.update(week, { capacityMinutes: Math.round(h * 60), bufferPercent: b }, 'Mavjud vaqt yangilandi')) setEditing(false)
  }

  const tone = capacity.isOverplanned ? 'warning' : 'default'

  return (
    <SectionCard
      title="Vaqt sig‘imi"
      description="Ishdan tashqari, rejalashtirish mumkin bo‘lgan vaqt"
      action={
        !editing && (
          <Button size="sm" variant="ghost" onClick={startEdit}>
            Sozlash
          </Button>
        )
      }
    >
      {editing ? (
        <form onSubmit={save} className="flex flex-col gap-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cap-hours">Haftalik soat</Label>
              <Input id="cap-hours" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cap-buffer">Buffer (%)</Label>
              <Input id="cap-buffer" type="number" min={0} max={80} value={buffer} onChange={(e) => setBuffer(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
          <p className="text-xs text-muted-foreground">Buffer — kutilmagan ishlar va dam olish uchun ataylab bo‘sh qoldiriladigan qism.</p>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Saqlash</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Bekor qilish</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="tabular text-2xl font-semibold">{formatMinutes(capacity.planned)}</span>
            <span className="text-sm text-muted-foreground">/ {formatMinutes(capacity.plannable)} rejalash mumkin</span>
          </div>
          <ProgressBar value={Math.min(100, capacity.usagePercent)} tone={tone} label="Vaqt sig‘imidan foydalanish" />
          <p className="text-xs text-muted-foreground">
            Jami {formatMinutes(capacity.capacity)}, shundan {bufferPercent}% buffer.
          </p>
          {capacity.isOverplanned ? (
            <p className="flex items-start gap-2 rounded-md bg-warning/15 px-3 py-2 text-xs text-warning-foreground" role="status">
              <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Reja mavjud vaqtdan {formatMinutes(capacity.overBy)} ga katta. Ba’zi vazifalarni keyingi haftaga qoldirishni ko‘rib chiqing.
            </p>
          ) : capacity.planned > 0 ? (
            <p className="flex items-center gap-2 text-xs text-success">
              <CheckCircle2Icon className="size-3.5" aria-hidden="true" /> Reja real va buffer saqlangan.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Vazifalarga taxminiy vaqt qo‘shsangiz, sig‘im hisoblanadi.</p>
          )}
        </div>
      )}
    </SectionCard>
  )
}
