import type { HTMLAttributes } from 'react'
import type { IconComponent } from 'runeicons-react'

export type AppIconProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  icon: IconComponent
  label?: string
  size?: number
}

export function AppIcon({ className = '', icon: Icon, label, size = 16, ...props }: AppIconProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center [&>svg]:pointer-events-none ${className}`}
      role={label ? 'img' : undefined}
      {...props}
    >
      <Icon size={size} />
    </span>
  )
}
