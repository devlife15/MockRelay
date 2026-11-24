import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'

export type CardVariant = 'default' | 'subtle' | 'interactive'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-[var(--bg-surface)]',
  subtle: 'bg-[var(--bg-subtle)]',
  interactive:
    'bg-[var(--bg-surface)] [transition-property:border-color,background-color] duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className = '', variant = 'default', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`rounded-lg border border-[var(--border-default)] ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
})

Card.displayName = 'Card'
