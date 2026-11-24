import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  containerClassName?: string
}

function mergeIds(...ids: Array<string | undefined>) {
  return ids.filter(Boolean).join(' ') || undefined
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
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
  const inputId = id ?? generatedId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={`grid gap-1.5 ${containerClassName}`}>
      <label className="text-xs font-medium text-[var(--text-primary)]" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        aria-describedby={mergeIds(ariaDescribedBy, descriptionId, errorId)}
        aria-invalid={error ? true : ariaInvalid}
        className={`h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 text-[13px] text-[var(--text-primary)] outline-none [transition-property:border-color,box-shadow,background-color] duration-150 placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)] aria-invalid:border-[var(--danger)] aria-invalid:focus:ring-[color-mix(in_srgb,var(--danger)_16%,transparent)] ${className}`}
        id={inputId}
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

Input.displayName = 'Input'
