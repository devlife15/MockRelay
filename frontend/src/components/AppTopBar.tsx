import { CircleQuestionMark, Settings } from 'runeicons-react'
import { Link } from 'react-router'
import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'
import { AppIcon } from './ui/AppIcon'
import { IconButton } from './ui/IconButton'

export function AppTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-5">
      <Brand />
      <div className="app-topbar-divider mx-4 h-5 w-px bg-[var(--border-default)]" />
      <Link
        className="app-topbar-projects-link text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        to="/app"
      >
        Projects
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <IconButton className="app-topbar-secondary-action" label="Help">
          <AppIcon icon={CircleQuestionMark} size={16} />
        </IconButton>
        <IconButton className="app-topbar-secondary-action" label="Settings">
          <AppIcon icon={Settings} size={16} />
        </IconButton>
        <ThemeToggle />
      </div>
    </header>
  )
}
