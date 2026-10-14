import { useQuery } from '@tanstack/react-query'
import { Boxes, FilePlus2, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { getErrorMessage } from '../api/client'
import { getProjectTemplates, templateKeys } from '../api/templates'
import type { CreateProjectRequest } from '../api/types'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'

type CreateProjectDialogProps = {
  onCreate: (request: CreateProjectRequest) => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}

function toProjectKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function formatLabel(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function CreateProjectDialog({ onCreate, onOpenChange, open }: CreateProjectDialogProps) {
  const nameId = useId()
  const descriptionId = useId()
  const keyId = useId()
  const errorId = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [templateKey, setTemplateKey] = useState<string | null>(null)
  const [keyWasEdited, setKeyWasEdited] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const trimmedName = name.trim()
  const normalizedKey = toProjectKey(projectKey)
  const nameIsInvalid = submitted && !trimmedName
  const keyIsInvalid = submitted && !normalizedKey
  const templatesQuery = useQuery({
    queryKey: templateKeys.all,
    queryFn: getProjectTemplates,
    enabled: open,
    staleTime: 5 * 60_000,
  })
  const templates = templatesQuery.data ?? []
  const selectedTemplate = templates.find((template) => template.key === templateKey)

  function handleNameChange(value: string) {
    setName(value)
    if (!keyWasEdited) setProjectKey(toProjectKey(value))
  }

  function resetForm() {
    setName('')
    setDescription('')
    setProjectKey('')
    setTemplateKey(null)
    setKeyWasEdited(false)
    setSubmitted(false)
    setSubmitError('')
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!trimmedName || !normalizedKey) return

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await onCreate({
        name: trimmedName,
        description: description.trim() || null,
        projectKey: normalizedKey,
        ...(templateKey ? { templateKey } : {}),
      })
      resetForm()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] data-[state=closed]:animate-[fade-out_120ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-32px)] w-[calc(100%-32px)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]">
          <div className="flex items-start justify-between border-b border-[var(--border-default)] px-5 py-4">
            <div>
              <Dialog.Title className="text-base leading-6 font-semibold tracking-[-0.015em]">Create project</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs leading-[17px] text-[var(--text-secondary)]">
                Start empty or use a ready-made API with realistic response scenarios.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton className="-mt-1 -mr-1" label="Close dialog">
                <X aria-hidden="true" size={15} strokeWidth={1.8} />
              </IconButton>
            </Dialog.Close>
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="space-y-5 overflow-y-auto px-5 py-5">
              <fieldset>
                <legend className="mb-2 block text-xs font-medium">Start from</legend>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Project starting point">
                  <button
                    aria-checked={templateKey === null}
                    className={`flex min-h-20 items-start gap-3 rounded-md border p-3 text-left outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--accent-subtle)] ${templateKey === null ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-default)] bg-[var(--bg-app)] hover:border-[var(--border-strong)]'}`}
                    onClick={() => setTemplateKey(null)}
                    role="radio"
                    type="button"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"><FilePlus2 aria-hidden="true" size={14} strokeWidth={1.8} /></span>
                    <span><span className="block text-[13px] font-semibold">Blank project</span><span className="mt-0.5 block text-xs leading-[17px] text-[var(--text-secondary)]">Build your endpoint collection from scratch.</span></span>
                  </button>

                  {templates.map((template) => (
                    <button
                      aria-checked={templateKey === template.key}
                      className={`flex min-h-20 items-start gap-3 rounded-md border p-3 text-left outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--accent-subtle)] ${templateKey === template.key ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-default)] bg-[var(--bg-app)] hover:border-[var(--border-strong)]'}`}
                      key={template.key}
                      onClick={() => setTemplateKey(template.key)}
                      role="radio"
                      type="button"
                    >
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent)]"><Boxes aria-hidden="true" size={14} strokeWidth={1.8} /></span>
                      <span className="min-w-0"><span className="flex items-center gap-1.5 text-[13px] font-semibold">{template.name}{template.featured ? <span className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">Featured</span> : null}</span><span className="mt-0.5 block text-xs leading-[17px] text-[var(--text-secondary)]">{template.endpointCount} endpoints · {template.scenarioCount} scenarios</span></span>
                    </button>
                  ))}
                </div>
                {templatesQuery.isPending ? <p className="mt-2 text-[11px] leading-4 text-[var(--text-muted)]">Loading starter templates…</p> : null}
                {templatesQuery.isError ? <p className="mt-2 text-[11px] leading-4 text-[var(--danger)]">Starter templates could not be loaded. You can still create a blank project.</p> : null}
                {selectedTemplate ? (
                  <div className="mt-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)]">
                      <span>{formatLabel(selectedTemplate.category)}</span><span aria-hidden="true">·</span><span>{formatLabel(selectedTemplate.complexity)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-[17px] text-[var(--text-secondary)]">{selectedTemplate.description}</p>
                    {selectedTemplate.behaviors.length > 0 ? <div className="mt-2 flex flex-wrap gap-1.5">{selectedTemplate.behaviors.map((behavior) => <span className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]" key={behavior}>{formatLabel(behavior)}</span>)}</div> : null}
                    {selectedTemplate.limitations.length > 0 ? <p className="mt-2 text-[10px] leading-[15px] text-[var(--text-muted)]">Note: {selectedTemplate.limitations[0]}</p> : null}
                  </div>
                ) : null}
              </fieldset>

              <div>
                <label className="mb-1.5 block text-xs font-medium" htmlFor={nameId}>Project name</label>
                <input
                  aria-describedby={nameIsInvalid ? errorId : undefined}
                  aria-invalid={nameIsInvalid}
                  autoFocus
                  className="h-8 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] px-2.5 text-[13px] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] aria-invalid:border-[var(--danger)]"
                  id={nameId}
                  maxLength={80}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Storefront API"
                  value={name}
                />
                {nameIsInvalid ? <p className="mt-1 text-[11px] leading-4 text-[var(--danger)]" id={errorId}>Enter a project name.</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium" htmlFor={descriptionId}>
                  Description <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                </label>
                <textarea
                  className="min-h-16 w-full resize-none rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] px-2.5 py-2 text-[13px] leading-[18px] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                  id={descriptionId}
                  maxLength={160}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What will this mock API be used for?"
                  value={description}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium" htmlFor={keyId}>Project key</label>
                <div className="flex h-8 overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)]">
                  <span className="flex items-center border-r border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 font-mono text-[11px] text-[var(--text-muted)]">/mock/</span>
                  <input
                    aria-invalid={keyIsInvalid}
                    className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs outline-none placeholder:text-[var(--text-muted)]"
                    id={keyId}
                    maxLength={48}
                    onChange={(event) => {
                      setKeyWasEdited(true)
                      setProjectKey(toProjectKey(event.target.value))
                    }}
                    placeholder="storefront-api"
                    value={projectKey}
                  />
                </div>
                {keyIsInvalid ? (
                  <p className="mt-1 text-[11px] leading-4 text-[var(--danger)]">Enter a project key.</p>
                ) : (
                  <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">Used in the callable URL. Lowercase letters, numbers, and hyphens only.</p>
                )}
              </div>
              {submitError ? <p className="text-[11px] leading-4 text-[var(--danger)]" role="alert">{submitError}</p> : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--border-default)] px-5 py-3">
              <Dialog.Close asChild><Button size="small">Cancel</Button></Dialog.Close>
              <Button disabled={isSubmitting} size="small" type="submit" variant="primary">{isSubmitting ? 'Creating…' : 'Create project'}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
