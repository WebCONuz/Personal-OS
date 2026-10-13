import { toast } from 'sonner'

export const notify = {
  success: (message: string) => toast.success(message, { duration: 2500 }),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  error: (message: string, description?: string) => toast.error(message, { description, duration: 6000 }),
}
