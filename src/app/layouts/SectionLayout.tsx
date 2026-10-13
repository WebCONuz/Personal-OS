import { Outlet } from 'react-router'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionTabs, type SectionTab } from '@/components/shared/SectionTabs'

/** Main section with route-backed tabs (e.g. Rejalashtirish → Haftalik / Bugun / Vazifalar…). */
export function SectionLayout({ title, description, tabs }: { title: string; description?: string; tabs: SectionTab[] }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <SectionTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
