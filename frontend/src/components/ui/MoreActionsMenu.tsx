import { DropdownMenu } from 'radix-ui'
import type { ReactNode } from 'react'
import { IconButton } from './IconButton'

export type MoreActionsMenuItem = {
  danger?: boolean
  icon: ReactNode
  label: string
  onSelect: () => void
  separatorBefore?: boolean
}

type MoreActionsMenuProps = {
  className?: string
  items: MoreActionsMenuItem[]
  label: string
  variant?: 'default' | 'brutal'
}

export function MoreActionsMenu({ className, items, label, variant = 'default' }: MoreActionsMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton className={className} label={label} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
          <span aria-hidden="true" className="relative -top-px text-sm leading-none tracking-[1px]">•••</span>
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className={`z-50 min-w-[172px] border bg-[var(--bg-surface)] p-1 ${variant === 'brutal' ? 'project-brutal-popover border-2 border-[var(--brutal-ink)] shadow-[4px_4px_0_var(--brutal-shadow)]' : 'rounded-md border-[var(--border-strong)] shadow-[0_12px_32px_rgba(0,0,0,0.22)]'}`}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          sideOffset={4}
        >
          {items.map((item) => (
            <div key={item.label}>
              {item.separatorBefore ? <DropdownMenu.Separator className={`${variant === 'brutal' ? 'my-1 h-0.5' : 'my-1 h-px'} bg-[var(--border-default)]`} /> : null}
              <DropdownMenu.Item
                className={`flex h-8 cursor-default items-center gap-2 px-2 text-xs outline-none data-[highlighted]:bg-[var(--bg-hover)] ${variant === 'default' ? 'rounded' : 'font-semibold'} ${item.danger ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}
                onSelect={item.onSelect}
              >
                <span className="text-[var(--text-muted)]">{item.icon}</span>{item.label}
              </DropdownMenu.Item>
            </div>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
