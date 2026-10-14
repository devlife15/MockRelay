import { useId, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { getErrorMessage } from '../api/client'
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

export function CreateProjectDialog({ onCreate, onOpenChange, open }: CreateProjectDialogProps) {
  const nameId = useId()
  const descriptionId = useId()
  const keyId = useId()
  const errorId = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [keyWasEdited, setKeyWasEdited] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const trimmedName = name.trim()
  const normalizedKey = toProjectKey(projectKey)
  const nameIsInvalid = submitted && !trimmedName
  const keyIsInvalid = submitted && !normalizedKey

  function handleNameChange(value: string) {
    setName(value)
    if (!keyWasEdited) setProjectKey(toProjectKey(value))
  }

  function resetForm() {
    setName('')
    setDescription('')
    setProjectKey('')
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
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-32px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]">
          <div className="flex items-start justify-between border-b border-[var(--border-default)] px-5 py-4">
            <div>
              <Dialog.Title className="text-base leading-6 font-semibold tracking-[-0.015em]">Create project</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs leading-[17px] text-[var(--text-secondary)]">
                Group related mock endpoints under one base URL.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton className="-mt-1 -mr-1" label="Close dialog">
                <X aria-hidden="true" size={15} strokeWidth={1.8} />
              </IconButton>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-5 py-5">
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
