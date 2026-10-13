import type { FormEventHandler, ReactNode } from 'react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel?: string
  size?: 'md' | 'lg'
  children: ReactNode
  /** Extra footer content on the left (e.g. a delete button). */
  footerExtra?: ReactNode
}

/** Dialog sized for real forms: scrollable body, sticky footer, Enter submits. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel = 'Saqlash',
  size = 'md',
  children,
  footerExtra,
}: FormDialogProps) {
  const formId = useId()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[min(90dvh,820px)] flex-col gap-0 p-0',
          size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
        </DialogHeader>
        <form id={formId} onSubmit={onSubmit} noValidate className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4">{children}</div>
        </form>
        <DialogFooter className="m-0 items-center rounded-b-xl border-t px-5 py-3 sm:justify-between">
          <div className="flex gap-2">{footerExtra}</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" form={formId}>
              {submitLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
