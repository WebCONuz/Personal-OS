import type { ComponentProps } from 'react'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useCollection, useLifeAreas } from '@/hooks/useData'
import { cn } from '@/lib/utils'

type SelectProps = Omit<ComponentProps<'select'>, 'size'> & { emptyLabel?: string }

function base(className?: string) {
  return cn('w-full', className)
}

/** Select for enum-like values backed by a labels map. */
export function EnumSelect<T extends string>({
  labels,
  emptyLabel,
  className,
  ...props
}: SelectProps & { labels: Record<T, string> }) {
  return (
    <NativeSelect className={base(className)} {...props}>
      {emptyLabel !== undefined && <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>}
      {(Object.keys(labels) as T[]).map((key) => (
        <NativeSelectOption key={key} value={key}>
          {labels[key]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

export function OptionsSelect({
  options,
  emptyLabel,
  className,
  ...props
}: SelectProps & { options: ReadonlyArray<string | { value: string; label: string }> }) {
  return (
    <NativeSelect className={base(className)} {...props}>
      {emptyLabel !== undefined && <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>}
      {options.map((o) => {
        const value = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        return (
          <NativeSelectOption key={value} value={value}>
            {label}
          </NativeSelectOption>
        )
      })}
    </NativeSelect>
  )
}

export function LifeAreaSelect({ emptyLabel = 'Soha tanlanmagan', className, ...props }: SelectProps) {
  const areas = useLifeAreas()
  return (
    <NativeSelect className={base(className)} {...props}>
      <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>
      {areas.map((a) => (
        <NativeSelectOption key={a.id} value={a.id} disabled={!a.isActive && props.value !== a.id}>
          {a.name}
          {!a.isActive ? ' (nofaol)' : ''}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

export function GoalSelect({
  emptyLabel = 'Maqsadsiz',
  excludeId,
  className,
  ...props
}: SelectProps & { excludeId?: string }) {
  const goals = useCollection('goals')
  const options = goals.filter((g) => g.id !== excludeId && g.status !== 'cancelled')
  return (
    <NativeSelect className={base(className)} {...props}>
      <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>
      {options.map((g) => (
        <NativeSelectOption key={g.id} value={g.id}>
          {g.title}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

export function ProjectSelect({ emptyLabel = 'Loyihasiz', className, ...props }: SelectProps) {
  const projects = useCollection('projects')
  const options = projects.filter((p) => p.status !== 'cancelled')
  return (
    <NativeSelect className={base(className)} {...props}>
      <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>
      {options.map((p) => (
        <NativeSelectOption key={p.id} value={p.id}>
          {p.title}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

export function TaskSelect({ emptyLabel = 'Vazifasiz', className, ...props }: SelectProps) {
  const tasks = useCollection('tasks')
  const options = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress')
  return (
    <NativeSelect className={base(className)} {...props}>
      <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>
      {options.map((t) => (
        <NativeSelectOption key={t.id} value={t.id}>
          {t.title}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

export function LearningItemSelect({ emptyLabel = 'O‘quv resursisiz', className, ...props }: SelectProps) {
  const items = useCollection('learningItems')
  const options = items.filter((l) => l.status !== 'completed' || l.id === props.value)
  return (
    <NativeSelect className={base(className)} {...props}>
      <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>
      {options.map((l) => (
        <NativeSelectOption key={l.id} value={l.id}>
          {l.title}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
