import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

export interface SectionTab {
  to: string
  label: string
  end?: boolean
}

/** Route-backed tabs for sub-pages inside a main section. */
export function SectionTabs({ tabs, className }: { tabs: SectionTab[]; className?: string }) {
  return (
    <nav aria-label="Bo‘lim sahifalari" className={cn('-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <ul className="flex w-max min-w-full gap-1 border-b">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  '-mb-px inline-flex h-9 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Pill-style local view switcher (not route-backed). */
export function ViewSwitcher<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<{ value: T; label: string; count?: number }>
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            value === o.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="tabular text-xs text-muted-foreground">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}
