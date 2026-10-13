import {
  BarChart3Icon,
  BriefcaseIcon,
  CalendarRangeIcon,
  GraduationCapIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  RocketIcon,
  SettingsIcon,
  TargetIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { to: '/goals', label: 'Maqsadlar', icon: TargetIcon },
  { to: '/planning', label: 'Rejalashtirish', icon: CalendarRangeIcon },
  { to: '/career', label: 'Karyera', icon: BriefcaseIcon },
  { to: '/business', label: 'Biznes va loyihalar', icon: RocketIcon },
  { to: '/learning', label: 'Ta’lim va bilim', icon: GraduationCapIcon },
  { to: '/finance', label: 'Moliya', icon: WalletIcon },
  { to: '/lifestyle', label: 'Hayot tarzi', icon: HeartPulseIcon },
  { to: '/analytics', label: 'Statistika', icon: BarChart3Icon },
]

export const SETTINGS_NAV: NavItem = { to: '/settings', label: 'Sozlamalar', icon: SettingsIcon }

/** Page titles for the top bar, matched by path prefix (longest first). */
export const PAGE_TITLES: Array<[prefix: string, title: string]> = [
  ['/planning/today', 'Bugun'],
  ['/planning/tasks', 'Vazifalar'],
  ['/planning/time', 'Vaqt kuzatuvi'],
  ['/planning/reviews', 'Review'],
  ['/planning', 'Rejalashtirish'],
  ['/goals', 'Maqsadlar'],
  ['/career', 'Karyera'],
  ['/business', 'Biznes va loyihalar'],
  ['/learning', 'Ta’lim va bilim'],
  ['/finance', 'Moliya'],
  ['/lifestyle', 'Hayot tarzi'],
  ['/analytics', 'Statistika va rivojlanish'],
  ['/settings', 'Sozlamalar'],
  ['/', 'Dashboard'],
]

export function pageTitleFor(pathname: string): string {
  return PAGE_TITLES.find(([prefix]) => (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)))?.[1] ?? 'Personal OS'
}
