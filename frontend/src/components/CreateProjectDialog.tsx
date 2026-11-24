import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Layers2, Plus, X } from 'runeicons-react'
import { useId, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { getErrorMessage } from '../api/client'
import { getProjectTemplates, templateKeys } from '../api/templates'
import type { CreateProjectRequest } from '../api/types'
import { StarterTemplateBrowser } from './StarterTemplateBrowser'
import { AppIcon } from './ui/AppIcon'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'

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
  const [step, setStep] = useState<'source' | 'details'>('source')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [templateKey, setTemplateKey] = useState<string | null>(null)
  const [keyWasEdited, setKeyWasEdited] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const templatesQuery = useQuery({
    queryKey: templateKeys.all,
    queryFn: getProjectTemplates,
    enabled: open,
    staleTime: 5 * 60_000,
  })
  const templates = templatesQuery.data ?? []
  const selectedTemplate = templates.find((template) => template.key === templateKey)
  const trimmedName = name.trim()
  const normalizedKey = toProjectKey(projectKey)
  const nameIsInvalid = submitted && !trimmedName
  const keyIsInvalid = submitted && !normalizedKey

  function handleNameChange(value: string) {
    setName(value)
    if (!keyWasEdited) setProjectKey(toProjectKey(value))
  }

  function resetForm() {
    setStep('source')
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
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex h-[min(600px,calc(100vh-32px))] w-[calc(100%-32px)] max-w-[720px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.3)] data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]">
          <div className="flex items-start justify-between border-b border-[var(--border-default)] px-6 py-5">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[9px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase"><span className={step === 'source' ? 'text-[var(--accent)]' : ''}>01 Start</span><span aria-hidden="true">/</span><span className={step === 'details' ? 'text-[var(--accent)]' : ''}>02 Details</span></div>
              <Dialog.Title className="text-[17px] leading-6 font-semibold tracking-[-0.015em]">{step === 'source' ? 'Choose your starting point' : 'Name your project'}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] leading-[18px] text-[var(--text-secondary)]">{step === 'source' ? 'Start clean or choose a ready-made API built around real client behaviors.' : 'Set the identity and callable base URL for your new mock API.'}</Dialog.Description>
            </div>
            <Dialog.Close asChild><IconButton className="-mt-1 -mr-1" label="Close dialog"><AppIcon icon={X} size={16} /></IconButton></Dialog.Close>
          </div>

          {step === 'source' ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6"><StarterTemplateBrowser isError={templatesQuery.isError} isLoading={templatesQuery.isPending} onSelect={setTemplateKey} selectedKey={templateKey} templates={templates} /></div>
              <div className="flex justify-end gap-2.5 border-t border-[var(--border-default)] bg-[var(--bg-subtle)] px-6 py-4"><Dialog.Close asChild><Button size="small">Cancel</Button></Dialog.Close><Button onClick={() => setStep('details')} size="small" variant="primary">Continue<AppIcon icon={ArrowRight} size={14} /></Button></div>
            </>
          ) : (
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <div className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] py-2.5 pr-3 pl-3"><span className="grid size-8 shrink-0 place-items-center text-[var(--text-secondary)]">{selectedTemplate ? <AppIcon icon={Layers2} size={16} /> : <AppIcon icon={Plus} size={18} />}</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{selectedTemplate?.name ?? 'Blank project'}</span><span className="mt-0.5 block truncate text-[10px] text-[var(--text-muted)]">{selectedTemplate ? `${selectedTemplate.endpointCount} endpoints · ${selectedTemplate.scenarioCount} scenarios will be created` : 'No starter endpoints will be added'}</span></span><button className="text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline" onClick={() => setStep('source')} type="button">Change</button></div>

                <Input autoFocus error={nameIsInvalid ? 'Enter a project name.' : undefined} id={nameId} label="Project name" maxLength={80} onChange={(event) => handleNameChange(event.target.value)} placeholder="e.g. Storefront API" value={name} />

                <Textarea className="min-h-18 resize-none" id={descriptionId} label={<>Description <span className="font-normal text-[var(--text-muted)]">(optional)</span></>} maxLength={160} onChange={(event) => setDescription(event.target.value)} placeholder="What will this mock API be used for?" value={description} />

                <div><label className="mb-1.5 block text-xs font-medium" htmlFor={keyId}>Project key</label><div className="flex h-9 overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] [transition-property:border-color,box-shadow] duration-150 hover:border-[var(--border-strong)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)]"><span className="flex items-center border-r border-[var(--border-default)] bg-[var(--bg-subtle)] px-2 font-mono text-[11px] text-[var(--text-muted)]">/mock/</span><input aria-invalid={keyIsInvalid} className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs outline-none placeholder:text-[var(--text-muted)]" id={keyId} maxLength={48} onChange={(event) => { setKeyWasEdited(true); setProjectKey(toProjectKey(event.target.value)) }} placeholder="storefront-api" value={projectKey} /></div>{keyIsInvalid ? <p className="mt-1 text-[11px] leading-4 text-[var(--danger)]">Enter a project key.</p> : <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">Used in the callable URL. Lowercase letters, numbers, and hyphens only.</p>}</div>
                {submitError ? <p className="text-[11px] leading-4 text-[var(--danger)]" role="alert">{submitError}</p> : null}
              </div>
              <div className="flex justify-between gap-2.5 border-t border-[var(--border-default)] bg-[var(--bg-subtle)] px-6 py-4"><Button onClick={() => setStep('source')} size="small"><AppIcon icon={ArrowLeft} size={14} />Back</Button><Button loading={isSubmitting} size="small" type="submit" variant="primary">Create project</Button></div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
