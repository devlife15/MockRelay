import { CircleHelp, Settings } from 'lucide-react'
import { Link } from 'react-router'
import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'
import { IconButton } from './ui/IconButton'

export function AppTopBar() {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4">
      <Brand />
      <div className="mx-4 h-5 w-px bg-[var(--border-default)]" />
      <Link
        className="text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        to="/app"
      >
        Projects
      </Link>
      <div className="ml-auto flex items-center gap-1.5">
        <IconButton label="Help">
          <CircleHelp aria-hidden="true" size={15} strokeWidth={1.8} />
        </IconButton>
        <IconButton label="Settings">
          <Settings aria-hidden="true" size={15} strokeWidth={1.8} />
        </IconButton>
        <ThemeToggle />
      </div>
    </header>
  )
}
