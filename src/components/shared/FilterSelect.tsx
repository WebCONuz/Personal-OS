import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

interface FilterSelectProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
  className?: string
}

/** Compact labelled select used in list filter bars. */
export function FilterSelect<T extends string>({ label, value, onChange, options, className }: FilterSelectProps<T>) {
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn('w-full sm:w-auto [&_select]:min-w-36', className)}
    >
      {options.map((o) => (
        <NativeSelectOption key={o.value} value={o.value}>
          {o.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

export function enumOptions<T extends string>(labels: Record<T, string>): Array<{ value: T; label: string }> {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}

export function withAll<T extends string>(options: Array<{ value: T; label: string }>, allLabel: string): Array<{ value: T | 'all'; label: string }> {
  return [{ value: 'all', label: allLabel }, ...options]
}
