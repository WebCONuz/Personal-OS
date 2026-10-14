import { ChevronLeftIcon, SparklesIcon, type LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { NavLink, useMatch, useResolvedPath } from "react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUiPrefs } from "@/lib/uiPrefs";
import { MAIN_NAV, SETTINGS_NAV, type NavItem } from "../config/navigation";

/*
 * Rows keep the same padding in both states and the collapsed rail is exactly one row wide, so
 * icons and the logo stay in place while the width animates; labels only fade.
 */
const rowClass =
  "flex h-9 w-full items-center gap-3 overflow-hidden rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none";

function RowContent({
  icon: Icon,
  label,
  collapsed,
}: {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}) {
  return (
    <>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span
        className={cn(
          "truncate transition-opacity duration-150",
          collapsed && "opacity-0",
        )}
      >
        {label}
      </span>
    </>
  );
}

function WithTooltip({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: ReactElement;
}) {
  if (!collapsed) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  // Active state is resolved here because Radix Slot (tooltip trigger) cannot merge
  // NavLink's function className — it must receive a plain string.
  const { pathname } = useResolvedPath(item.to);
  const isActive = useMatch({ path: pathname, end: item.end ?? false }) !== null;
  return (
    <WithTooltip collapsed={collapsed} label={item.label}>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={cn(
          rowClass,
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : // Dark accent is Telegram's "selected" blue; hover uses a neutral tint like Telegram.
              "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground dark:hover:bg-sidebar-foreground/5",
        )}
      >
        <RowContent icon={item.icon} label={item.label} collapsed={collapsed} />
      </NavLink>
    </WithTooltip>
  );
}

export function NavList({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-1">
      <ul className="flex flex-col gap-0.5">
        {MAIN_NAV.map((item) => (
          <li key={item.to}>
            <NavItemLink
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-sidebar-border pt-2">
        <NavItemLink
          item={SETTINGS_NAV}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <SparklesIcon className="size-4" aria-hidden="true" />
      </div>
      <span
        className={cn(
          "font-semibold tracking-tight transition-opacity duration-150",
          collapsed && "opacity-0",
        )}
      >
        Personal OS
      </span>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useUiPrefs((s) => s.sidebarCollapsed);
  const toggle = useUiPrefs((s) => s.toggleSidebar);
  const toggleLabel = collapsed ? "Yon panelni ochish" : "Yon panelni yig‘ish";
  return (
    // Sticky creates a stacking context; z-40 keeps the edge toggle above the sticky top bar.
    <aside
      className={cn(
        "sticky top-0 z-40 hidden h-dvh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out lg:block",
        collapsed ? "w-13" : "w-60",
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-2.5">
          <Brand collapsed={collapsed} />
        </div>
        <nav
          aria-label="Asosiy navigatsiya"
          className="flex-1 overflow-x-hidden overflow-y-auto p-2"
        >
          <NavList collapsed={collapsed} />
        </nav>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggle}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            className="absolute top-7 -right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
          >
            <ChevronLeftIcon
              className={cn(
                "size-3.5 transition-transform duration-200",
                collapsed && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{toggleLabel}</TooltipContent>
      </Tooltip>
    </aside>
  );
}
