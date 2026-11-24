import { Dialog } from 'radix-ui'
import { X } from 'runeicons-react'
import { useId, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/client'
import type { Project, UpdateProjectRequest } from '../api/types'
import { AppIcon } from './ui/AppIcon'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'

type EditProjectDialogProps = {
  onOpenChange: (open: boolean) => void
  onSave: (request: UpdateProjectRequest) => Promise<void>
  open: boolean
  project: Project
  projects: Project[]
}

function toProjectKey(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
}

export function EditProjectDialog({ onOpenChange, onSave, open, project, projects }: EditProjectDialogProps) {
  const nameId = useId()
  const descriptionId = useId()
  const keyId = useId()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [projectKey, setProjectKey] = useState(project.projectKey)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const trimmedName = name.trim()
  const normalizedKey = toProjectKey(projectKey)
  const duplicateKey = projects.some((item) => item.id !== project.id && item.projectKey === normalizedKey)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!trimmedName || !normalizedKey || duplicateKey) return

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await onSave({ name: trimmedName, description: description.trim() || null, projectKey: normalizedKey })
      onOpenChange(false)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] data-[state=closed]:animate-[fade-out_120ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.3)] data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]">
          <div className="flex items-start justify-between border-b border-[var(--border-default)] px-5 py-4">
            <div><Dialog.Title className="text-base font-semibold tracking-[-0.015em]">Edit project</Dialog.Title><Dialog.Description className="mt-0.5 text-xs text-[var(--text-secondary)]">Update the project details and runtime key.</Dialog.Description></div>
            <Dialog.Close asChild><IconButton className="-mr-1 -mt-1" label="Close dialog"><AppIcon icon={X} size={15} /></IconButton></Dialog.Close>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-5 py-5">
              <Input autoFocus error={submitted && !trimmedName ? 'Enter a project name.' : undefined} id={nameId} label="Project name" maxLength={80} onChange={(event) => setName(event.target.value)} value={name} />
              <Textarea className="min-h-16 resize-none" id={descriptionId} label={<>Description <span className="font-normal text-[var(--text-muted)]">(optional)</span></>} maxLength={160} onChange={(event) => setDescription(event.target.value)} value={description} />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">Project key</span>
                <div className="flex h-9 overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] [transition-property:border-color,box-shadow] duration-150 hover:border-[var(--border-strong)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)]"><span className="flex items-center border-r border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 font-mono text-[11px] text-[var(--text-muted)]">/mock/</span><input aria-invalid={submitted && (!normalizedKey || duplicateKey)} className="min-w-0 flex-1 border-0 bg-transparent px-2 font-mono text-xs outline-none" id={keyId} maxLength={48} onChange={(event) => setProjectKey(toProjectKey(event.target.value))} value={projectKey} /></div>
                {submitted && !normalizedKey ? <span className="mt-1 block text-[11px] text-[var(--danger)]">Enter a project key.</span> : duplicateKey ? <span className="mt-1 block text-[11px] text-[var(--danger)]">This project key is already in use.</span> : <span className="mt-1 block text-[11px] text-[var(--text-muted)]">Changing this updates every mock URL in the project.</span>}
              </label>
              {submitError ? <p className="text-[11px] text-[var(--danger)]" role="alert">{submitError}</p> : null}
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--border-default)] bg-[var(--bg-subtle)] px-5 py-4"><Dialog.Close asChild><Button size="small">Cancel</Button></Dialog.Close><Button loading={isSubmitting} size="small" type="submit" variant="primary">Save changes</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
