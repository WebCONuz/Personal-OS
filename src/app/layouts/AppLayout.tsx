import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMeta } from '@/hooks/useData'
import { CommandSearch } from './CommandSearch'
import { DemoBanner } from './DemoBanner'
import { Brand, NavList, Sidebar } from './Sidebar'
import { StorageIssuesBanner } from './StorageIssuesBanner'
import { TopBar } from './TopBar'

// Form dialogs are split into their own chunk; they are only needed after first interaction.
const EditorHosts = lazy(async () => ({ default: (await import('./EditorHosts')).EditorHosts }))

export function AppLayout() {
  const meta = useMeta()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  if (!meta.onboarded) return <Navigate to="/welcome" replace />

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Asosiy kontentga o‘tish
      </a>
      <Sidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle asChild>
              <div>
                <Brand />
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">Asosiy navigatsiya</SheetDescription>
          </SheetHeader>
          <nav aria-label="Asosiy navigatsiya" className="flex-1 overflow-y-auto p-2">
            <NavList onNavigate={() => setMobileOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <StorageIssuesBanner />
        <DemoBanner />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <CommandSearch />
      <Suspense fallback={null}>
        <EditorHosts />
      </Suspense>
    </div>
  )
}
