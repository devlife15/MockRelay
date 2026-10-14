import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/client'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'

type ScenarioNameDialogProps = {
  existingNames: string[]
  initialName?: string
  mode: 'create' | 'rename'
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => Promise<void>
  open: boolean
}

export function ScenarioNameDialog({ existingNames, initialName = '', mode, onOpenChange, onSubmit, open }: ScenarioNameDialogProps) {
  const nameId = useId()
  const [name, setName] = useState(initialName)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const trimmedName = name.trim()
  const duplicateName = existingNames.some((item) => item.toLowerCase() === trimmedName.toLowerCase())
  const visibleError = submitted
    ? !trimmedName
      ? 'Scenario name is required.'
      : duplicateName
        ? 'A scenario with this name already exists.'
        : ''
    : ''

  function reset() {
    setName(initialName)
    setSubmitted(false)
    setSubmitError('')
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!trimmedName || duplicateName) return

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit(trimmedName)
      reset()
      onOpenChange(false)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const creating = mode === 'create'

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] data-[state=closed]:animate-[fade-out_120ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]">
          <div className="flex items-start justify-between border-b border-[var(--border-default)] px-5 py-4">
            <div>
              <Dialog.Title className="text-base leading-6 font-semibold tracking-[-0.015em]">{creating ? 'Create response scenario' : 'Rename response scenario'}</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs leading-[17px] text-[var(--text-secondary)]">
                {creating ? 'Start from a copy of the response currently open.' : 'Use a short name that describes when this response is useful.'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild><IconButton className="-mt-1 -mr-1" label="Close dialog"><X aria-hidden="true" size={15} /></IconButton></Dialog.Close>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-5 py-5">
              <label className="mb-1.5 block text-xs font-medium" htmlFor={nameId}>Scenario name</label>
              <input
                aria-invalid={Boolean(visibleError)}
                autoFocus
                className="h-8 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] px-2.5 text-[13px] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] aria-invalid:border-[var(--danger)]"
                id={nameId}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. User not found"
                value={name}
              />
              {visibleError ? <p className="mt-1 text-[11px] text-[var(--danger)]">{visibleError}</p> : <p className="mt-1 text-[11px] text-[var(--text-muted)]">Names must be unique within this endpoint.</p>}
              {submitError ? <p className="mt-2 text-[11px] text-[var(--danger)]" role="alert">{submitError}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-[var(--border-default)] px-5 py-3">
              <Dialog.Close asChild><Button size="small">Cancel</Button></Dialog.Close>
              <Button disabled={isSubmitting} size="small" type="submit" variant="primary">{isSubmitting ? 'Saving…' : creating ? 'Create scenario' : 'Save name'}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
