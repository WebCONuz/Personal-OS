import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  /** A single control element; id / aria attributes are injected automatically. */
  children: ReactElement<Record<string, unknown>>
}

/** Label + control + hint + inline error, with proper id/aria wiring for accessibility. */
export function FormField({ id, label, error, hint, required, className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })
    : children
  return (
    <Field data-invalid={error ? true : undefined} className={cn('gap-1.5', className)}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </FieldLabel>
      {control}
      {hint && !error && <FieldDescription id={hintId}>{hint}</FieldDescription>}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-4 sm:grid-cols-2', className)}>{children}</div>
}
