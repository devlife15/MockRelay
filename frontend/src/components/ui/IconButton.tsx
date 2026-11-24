import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type IconButtonVariant = 'ghost' | 'secondary' | 'danger'
export type IconButtonSize = 'small' | 'default' | 'large'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
  size?: IconButtonSize
  variant?: IconButtonVariant
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
  secondary:
    'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
  danger:
    'border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] hover:text-[var(--danger)]',
}

const sizeClasses: Record<IconButtonSize, string> = {
  small: 'size-7',
  default: 'size-8',
  large: 'size-9',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    children,
    className = '',
    label,
    size = 'default',
    type = 'button',
    variant = 'ghost',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={`inline-grid shrink-0 touch-manipulation select-none place-items-center rounded-md border [transition-property:color,background-color,border-color,opacity,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-subtle)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-app)] active:scale-95 motion-reduce:active:scale-100 [&[aria-haspopup]]:active:scale-100 [&[data-state]]:active:scale-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
})

IconButton.displayName = 'IconButton'
