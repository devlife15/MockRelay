import { Layers2, Plus } from 'runeicons-react'
import type { StarterApiTemplateSummary } from '../api/types'
import { AppIcon } from './ui/AppIcon'

type StarterTemplateBrowserProps = {
  isError: boolean
  isLoading: boolean
  onSelect: (templateKey: string | null) => void
  selectedKey: string | null
  templates: StarterApiTemplateSummary[]
}

export function StarterTemplateBrowser({
  isError,
  isLoading,
  onSelect,
  selectedKey,
  templates,
}: StarterTemplateBrowserProps) {
  return (
    <fieldset>
      <legend className="sr-only">Project starting point</legend>
      <div role="radiogroup" aria-label="Project starting point">
        <button
          aria-checked={selectedKey === null}
          className={`flex min-h-16 w-full max-w-[190px] items-center justify-center gap-3 rounded-lg border px-4 py-3.5 text-center outline-none [transition-property:border-color,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent-subtle)] ${selectedKey === null ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'}`}
          onClick={() => onSelect(null)}
          role="radio"
          type="button"
        >
          <AppIcon className="text-[var(--text-secondary)]" icon={Plus} size={20} />
          <span className="truncate text-sm font-semibold">Blank project</span>
        </button>

        <div className="mt-7 flex items-end justify-between gap-3 border-b border-[var(--border-default)] pb-3">
          <div><h2 className="text-sm font-semibold">Starter APIs</h2><p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Choose a ready-made API and start testing immediately.</p></div>
          {!isLoading && !isError ? <span className="text-[11px] text-[var(--text-muted)]">{templates.length} available</span> : null}
        </div>

        {isLoading ? <div className="mt-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-10 text-center text-xs text-[var(--text-muted)]">Loading starter APIs…</div> : null}
        {isError ? <div className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--danger)_28%,var(--border-default))] bg-[color-mix(in_srgb,var(--danger)_7%,var(--bg-surface))] px-4 py-5 text-xs leading-5 text-[var(--danger)]">Starter APIs could not be loaded. Blank project creation is still available.</div> : null}

        {!isLoading && !isError ? (
          <div className="mt-4 flex flex-wrap gap-3.5">
            {templates.map((template) => {
              const isSelected = selectedKey === template.key
              return (
                <button
                  aria-checked={isSelected}
                  className={`flex min-h-16 w-full max-w-[190px] items-center justify-center gap-3 rounded-lg border px-4 py-3.5 text-center outline-none [transition-property:border-color,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent-subtle)] ${isSelected ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'}`}
                  key={template.key}
                  onClick={() => onSelect(template.key)}
                  role="radio"
                  type="button"
                >
                  <AppIcon className="text-[var(--text-secondary)]" icon={Layers2} size={18} />
                  <span className="truncate text-sm font-semibold">{template.name}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </fieldset>
  )
}
