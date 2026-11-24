import { Moon, Sun } from 'runeicons-react'
import { useEffect, useState } from 'react'
import { AppIcon } from './ui/AppIcon'
import { IconButton } from './ui/IconButton'

type Theme = 'light' | 'dark'

const storageKey = 'mockrelay-theme'

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem(storageKey)

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(storageKey, theme)
  }, [theme])

  return (
    <div
      aria-label="Appearance"
      className="flex rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] p-0.5"
      role="group"
    >
      <IconButton
        aria-pressed={theme === 'light'}
        className={
          theme === 'light'
            ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-sm'
            : ''
        }
        label="Use light theme"
        onClick={() => setTheme('light')}
      >
        <AppIcon icon={Sun} size={15} />
      </IconButton>
      <IconButton
        aria-pressed={theme === 'dark'}
        className={
          theme === 'dark'
            ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-sm'
            : ''
        }
        label="Use dark theme"
        onClick={() => setTheme('dark')}
      >
        <AppIcon icon={Moon} size={15} />
      </IconButton>
    </div>
  )
}
