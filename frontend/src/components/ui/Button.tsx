import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'small' | 'default' | 'large'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  loading?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]',
  secondary:
    'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]',
  ghost:
    'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
  danger:
    'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--danger)] hover:border-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_7%,var(--bg-surface))]',
}

const sizeClasses: Record<ButtonSize, string> = {
  small: 'h-8 px-3 text-xs',
  default: 'h-9 px-3.5 text-[13px]',
  large: 'h-10 px-4 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    'aria-disabled': ariaDisabled,
    children,
    className = '',
    disabled,
    loading = false,
    onClick,
    size = 'default',
    type = 'button',
    variant = 'secondary',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      {...props}
      aria-busy={loading || undefined}
      aria-disabled={loading || ariaDisabled || undefined}
      className={`relative inline-flex shrink-0 touch-manipulation select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border font-medium leading-none [transition-property:color,background-color,border-color,opacity,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-subtle)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-app)] active:scale-[0.98] motion-reduce:active:scale-100 [&[aria-haspopup]]:active:scale-100 [&[data-state]]:active:scale-100 [&[role=combobox]]:active:scale-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-[busy=true]:cursor-progress ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      onClick={loading ? (event) => event.preventDefault() : onClick}
      type={type}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="absolute size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      ) : null}
      <span className={`inline-flex items-center justify-center gap-1.5 ${loading ? 'opacity-0' : ''}`}>
        {children}
      </span>
    </button>
  )
})

Button.displayName = 'Button'
