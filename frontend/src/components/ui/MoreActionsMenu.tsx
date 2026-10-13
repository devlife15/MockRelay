import { DropdownMenu } from 'radix-ui'
import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
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
}

export function MoreActionsMenu({ className, items, label }: MoreActionsMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton className={className} label={label} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
          <MoreHorizontal aria-hidden="true" size={15} />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-[172px] rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1 shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          sideOffset={4}
        >
          {items.map((item) => (
            <div key={item.label}>
              {item.separatorBefore ? <DropdownMenu.Separator className="my-1 h-px bg-[var(--border-default)]" /> : null}
              <DropdownMenu.Item
                className={`flex h-8 cursor-default items-center gap-2 rounded px-2 text-xs outline-none data-[highlighted]:bg-[var(--bg-hover)] ${item.danger ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}
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
