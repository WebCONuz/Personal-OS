import { TriangleAlertIcon, XIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useDb } from '@/data/store'

/** Surfaces storage load problems (corrupt JSON, failed migration, unavailable storage). */
export function StorageIssuesBanner() {
  const issues = useDb((s) => s.issues)
  const dismiss = useDb((s) => s.dismissIssue)
  if (issues.length === 0) return null
  return (
    <div className="flex flex-col gap-2 border-b bg-warning/10 px-4 py-3 lg:px-6" role="alert">
      {issues.map((issue, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden="true" />
          <p className="flex-1">
            {issue.message}{' '}
            {issue.recoveryKey && (
              <Link to="/settings#recovery" className="font-medium underline underline-offset-2">
                Zaxira nusxani ko‘rish
              </Link>
            )}
          </p>
          <Button variant="ghost" size="icon-xs" onClick={() => dismiss(i)} aria-label="Xabarni yopish">
            <XIcon />
          </Button>
        </div>
      ))}
    </div>
  )
}
