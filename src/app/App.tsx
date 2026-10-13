import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from './router'

export function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" closeButton />
    </TooltipProvider>
  )
}
