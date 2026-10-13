import { PanelLeftCloseIcon, PanelLeftOpenIcon, SparklesIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUiPrefs } from '@/lib/uiPrefs'
import { MAIN_NAV, SETTINGS_NAV, type NavItem } from '../config/navigation'

function NavItemLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        )
      }
      aria-label={collapsed ? item.label : undefined}
    >
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function NavList({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-1">
      <ul className="flex flex-col gap-0.5">
        {MAIN_NAV.map((item) => (
          <li key={item.to}>
            <NavItemLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-sidebar-border pt-2">
        <NavItemLink item={SETTINGS_NAV} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

export function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <SparklesIcon className="size-4" aria-hidden="true" />
      </div>
      {!collapsed && <span className="font-semibold tracking-tight">Personal OS</span>}
    </div>
  )
}

export function Sidebar() {
  const collapsed = useUiPrefs((s) => s.sidebarCollapsed)
  const toggle = useUiPrefs((s) => s.toggleSidebar)
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-150 lg:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex h-14 items-center border-b border-sidebar-border px-3', collapsed ? 'justify-center' : 'justify-between')}>
        <Brand collapsed={collapsed} />
        {!collapsed && (
          <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label="Yon panelni yig‘ish">
            <PanelLeftCloseIcon />
          </Button>
        )}
      </div>
      <nav aria-label="Asosiy navigatsiya" className="flex-1 overflow-y-auto p-2">
        <NavList collapsed={collapsed} />
      </nav>
      {collapsed && (
        <div className="border-t border-sidebar-border p-2">
          <Button variant="ghost" size="icon" className="w-full" onClick={toggle} aria-label="Yon panelni ochish">
            <PanelLeftOpenIcon />
          </Button>
        </div>
      )}
    </aside>
  )
}
