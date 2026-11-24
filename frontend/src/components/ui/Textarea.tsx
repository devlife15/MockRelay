import { forwardRef, useId } from 'react'
import type { ReactNode, TextareaHTMLAttributes } from 'react'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  containerClassName?: string
}

function mergeIds(...ids: Array<string | undefined>) {
  return ids.filter(Boolean).join(' ') || undefined
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    className = '',
    containerClassName = '',
    description,
    error,
    id,
    label,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const descriptionId = description ? `${textareaId}-description` : undefined
  const errorId = error ? `${textareaId}-error` : undefined

  return (
    <div className={`grid gap-1.5 ${containerClassName}`}>
      <label className="text-xs font-medium text-[var(--text-primary)]" htmlFor={textareaId}>
        {label}
      </label>
      <textarea
        ref={ref}
        aria-describedby={mergeIds(ariaDescribedBy, descriptionId, errorId)}
        aria-invalid={error ? true : ariaInvalid}
        className={`min-h-20 w-full resize-y rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-2 text-[13px] leading-5 text-[var(--text-primary)] outline-none [transition-property:border-color,box-shadow,background-color] duration-150 placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)] aria-invalid:border-[var(--danger)] aria-invalid:focus:ring-[color-mix(in_srgb,var(--danger)_16%,transparent)] ${className}`}
        id={textareaId}
        {...props}
      />
      {error ? (
        <p className="text-[11px] leading-4 text-[var(--danger)]" id={errorId} role="alert">
          {error}
        </p>
      ) : description ? (
        <p className="text-[11px] leading-4 text-[var(--text-muted)]" id={descriptionId}>
          {description}
        </p>
      ) : null}
    </div>
  )
})

Textarea.displayName = 'Textarea'
