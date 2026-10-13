import type { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">{children}</kbd>
}
