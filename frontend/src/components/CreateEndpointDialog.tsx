import { useId, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { getErrorMessage } from '../api/client'
import type { CreateEndpointRequest, Endpoint, HttpMethod } from '../api/types'
import { validateEndpointPath } from '../utils/endpointValidation'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

type CreateEndpointDialogProps = {
  endpoints: Endpoint[]
  onCreate: (request: CreateEndpointRequest) => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
  projectKey: string
}

export function CreateEndpointDialog({ endpoints, onCreate, onOpenChange, open, projectKey }: CreateEndpointDialogProps) {
  const methodId = useId()
  const pathId = useId()
  const nameId = useId()
  const pathErrorId = useId()
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const trimmedPath = path.trim()
  const pathError = submitted ? validateEndpointPath(trimmedPath) : ''
  const isDuplicate = submitted && endpoints.some((endpoint) => endpoint.method === method && endpoint.path === trimmedPath)

  function resetForm() {
    setMethod('GET')
    setPath('')
    setName('')
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

    if (validateEndpointPath(trimmedPath) || endpoints.some((endpoint) => endpoint.method === method && endpoint.path === trimmedPath)) return

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await onCreate({ name: name.trim(), method, path: trimmedPath })
      resetForm()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const visibleError = pathError || (isDuplicate ? `${method} ${trimmedPath} already exists.` : '')

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] data-[state=closed]:animate-[fade-out_120ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-32px)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.28)] data-[state=closed]:animate-[fade-out_100ms_ease-out] data-[state=open]:animate-[fade-in_120ms_ease-out]">
          <div className="flex items-start justify-between border-b border-[var(--border-default)] px-5 py-4">
            <div>
              <Dialog.Title className="text-base leading-6 font-semibold tracking-[-0.015em]">Create endpoint</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs leading-[17px] text-[var(--text-secondary)]">
                Define the route your mock API should match.
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
                <div className="mb-1.5 grid grid-cols-[104px_1fr] gap-2 text-xs font-medium">
                  <label htmlFor={methodId}>Method</label>
                  <label htmlFor={pathId}>Path</label>
                </div>
                <div className="grid grid-cols-[104px_1fr] gap-2">
                  <select
                    className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] px-2 font-mono text-xs font-semibold outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                    id={methodId}
                    onChange={(event) => setMethod(event.target.value as HttpMethod)}
                    value={method}
                  >
                    {methods.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <input
                    aria-describedby={visibleError ? pathErrorId : undefined}
                    aria-invalid={Boolean(visibleError)}
                    autoFocus
                    className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] px-2.5 font-mono text-xs outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] aria-invalid:border-[var(--danger)]"
                    id={pathId}
                    onChange={(event) => setPath(event.target.value)}
                    placeholder="/users/{id}"
                    value={path}
                  />
                </div>
                {visibleError ? (
                  <p className="mt-1 text-[11px] leading-4 text-[var(--danger)]" id={pathErrorId}>{visibleError}</p>
                ) : (
                  <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">Use Spring-style path parameters such as {'{id}'}.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium" htmlFor={nameId}>
                  Endpoint name <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                </label>
                <input
                  className="h-8 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] px-2.5 text-[13px] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                  id={nameId}
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Get user"
                  value={name}
                />
              </div>

              <div>
                <div className="mb-1.5 text-xs font-medium">Mock URL preview</div>
                <div className="truncate rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-2 font-mono text-[11px] text-[var(--text-secondary)]">
                  http://localhost:8080/mock/{projectKey}{trimmedPath || '/users/{id}'}
                </div>
              </div>
              {submitError ? <p className="text-[11px] leading-4 text-[var(--danger)]" role="alert">{submitError}</p> : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--border-default)] px-5 py-3">
              <Dialog.Close asChild><Button size="small">Cancel</Button></Dialog.Close>
              <Button disabled={isSubmitting} size="small" type="submit" variant="primary">{isSubmitting ? 'Creating…' : 'Create endpoint'}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
