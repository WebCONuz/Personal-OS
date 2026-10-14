import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useResolvedTheme, useThemeSync } from '@/hooks/useTheme'
import { router } from './router'

export function App() {
  useThemeSync()
  const theme = useResolvedTheme()
  return (
    <TooltipProvider delayDuration={300}>
      <RouterProvider router={router} />
      <Toaster theme={theme} position="bottom-right" closeButton />
    </TooltipProvider>
  )
}
