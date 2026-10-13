import { create } from 'zustand'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface ConfirmState {
  options: ConfirmOptions | null
  resolve: ((value: boolean) => void) | null
  open: (options: ConfirmOptions) => Promise<boolean>
  close: (value: boolean) => void
}

const useConfirmStore = create<ConfirmState>()((set, get) => ({
  options: null,
  resolve: null,
  open: (options) =>
    new Promise<boolean>((resolve) => {
      get().resolve?.(false)
      set({ options, resolve })
    }),
  close: (value) => {
    get().resolve?.(value)
    set({ options: null, resolve: null })
  },
}))

/** Promise-based confirmation for destructive actions: `if (await confirm({...})) remove()`. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().open(options)
}

export function ConfirmHost() {
  const options = useConfirmStore((s) => s.options)
  const close = useConfirmStore((s) => s.close)
  return (
    <AlertDialog open={options !== null} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>{options?.cancelLabel ?? 'Bekor qilish'}</AlertDialogCancel>
          <AlertDialogAction
            className={options?.destructive ? buttonVariants({ variant: 'destructive' }) : undefined}
            onClick={() => close(true)}
          >
            {options?.confirmLabel ?? 'Tasdiqlash'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function confirmDelete(what: string, extra?: string): Promise<boolean> {
  return confirm({
    title: `${what} o‘chirilsinmi?`,
    description: extra ?? 'Bu amalni qaytarib bo‘lmaydi.',
    confirmLabel: 'O‘chirish',
    destructive: true,
  })
}
