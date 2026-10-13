import { ChevronLeft, CopyPlus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { Endpoint, Project } from '../App'
import { AppTopBar } from '../components/AppTopBar'
import { CreateEndpointDialog } from '../components/CreateEndpointDialog'
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog'
import { EndpointEditor } from '../components/EndpointEditor'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { MoreActionsMenu } from '../components/ui/MoreActionsMenu'

type ProjectWorkspacePageProps = {
  endpointsByProject: Record<string, Endpoint[]>
  onCreateEndpoint: (projectId: string, endpoint: Endpoint) => void
  onDeleteEndpoint: (projectId: string, endpointId: string) => void
  onUpdateEndpoint: (projectId: string, endpoint: Endpoint) => void
  projects: Project[]
}

function createDuplicateId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function ProjectWorkspacePage({ endpointsByProject, onCreateEndpoint, onDeleteEndpoint, onUpdateEndpoint, projects }: ProjectWorkspacePageProps) {
  const { projectId = '' } = useParams()
  const project = projects.find((item) => item.id === projectId)
  const projectName = project?.name ?? 'Untitled project'
  const projectKey = project?.key ?? 'project'
  const endpoints = endpointsByProject[projectId] ?? []
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(endpoints[0]?.id ?? null)
  const [endpointToDelete, setEndpointToDelete] = useState<Endpoint | null>(null)
  const selectedEndpoint = endpoints.find((endpoint) => endpoint.id === selectedEndpointId) ?? endpoints[0]

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setDialogIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleCreate(endpoint: Endpoint) {
    onCreateEndpoint(projectId, endpoint)
    setSelectedEndpointId(endpoint.id)
    setDialogIsOpen(false)
  }

  function duplicateEndpoint(endpoint: Endpoint) {
    let suffix = 1
    let nextPath = `${endpoint.path}-copy`
    while (endpoints.some((item) => item.method === endpoint.method && item.path === nextPath)) {
      suffix += 1
      nextPath = `${endpoint.path}-copy-${suffix}`
    }
    const duplicatedEndpoint: Endpoint = {
      ...endpoint,
      id: createDuplicateId('endpoint'),
      name: `${endpoint.name || endpoint.path} copy`,
      path: nextPath,
      headers: (endpoint.headers ?? []).map((header) => ({ ...header, id: createDuplicateId('header') })),
    }
    onCreateEndpoint(projectId, duplicatedEndpoint)
    setSelectedEndpointId(duplicatedEndpoint.id)
  }

  function deleteEndpoint(endpoint: Endpoint) {
    if (selectedEndpoint?.id === endpoint.id) {
      const index = endpoints.findIndex((item) => item.id === endpoint.id)
      setSelectedEndpointId(endpoints[index + 1]?.id ?? endpoints[index - 1]?.id ?? null)
    }
    onDeleteEndpoint(projectId, endpoint.id)
    setEndpointToDelete(null)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      <AppTopBar />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[248px] shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="border-b border-[var(--border-default)] px-3 py-3">
            <Link className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]" to="/app">
              <ChevronLeft aria-hidden="true" size={13} /> All projects
            </Link>
            <div className="truncate text-[13px] font-semibold" title={projectName}>{projectName}</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-[var(--text-muted)]">/mock/{projectKey}</div>
          </div>
          <div className="flex h-10 items-center justify-between border-b border-[var(--border-default)] px-3">
            <span className="text-xs font-semibold">Endpoints <span className="font-normal text-[var(--text-muted)]">{endpoints.length}</span></span>
            <IconButton label="Create endpoint" onClick={() => setDialogIsOpen(true)}>
              <Plus aria-hidden="true" size={14} />
            </IconButton>
          </div>

          {endpoints.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-[11px] leading-4 text-[var(--text-muted)]">No endpoints yet</p>
              <button className="mt-1.5 text-[11px] font-medium text-[var(--accent)] hover:underline" onClick={() => setDialogIsOpen(true)} type="button">
                New endpoint
              </button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {endpoints.map((endpoint) => {
                const isSelected = endpoint.id === selectedEndpoint?.id
                return (
                  <div
                    className={`group relative flex h-[42px] cursor-pointer items-center gap-2 border-l-2 px-2.5 ${isSelected ? 'border-l-[var(--accent)] bg-[var(--bg-subtle)]' : 'border-l-transparent hover:bg-[var(--bg-hover)]'}`}
                    key={endpoint.id}
                    onClick={() => setSelectedEndpointId(endpoint.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') setSelectedEndpointId(endpoint.id)
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className={`w-9 shrink-0 font-mono text-[9px] font-semibold method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11px]">{endpoint.path}</div>
                      {endpoint.name ? <div className="truncate text-[10px] text-[var(--text-muted)]">{endpoint.name}</div> : null}
                    </div>
                    <MoreActionsMenu
                      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                      items={[
                        { icon: <CopyPlus aria-hidden="true" size={13} />, label: 'Duplicate endpoint', onSelect: () => duplicateEndpoint(endpoint) },
                        { danger: true, icon: <Trash2 aria-hidden="true" size={13} />, label: 'Delete endpoint', onSelect: () => setEndpointToDelete(endpoint), separatorBefore: true },
                      ]}
                      label={`More actions for ${endpoint.method} ${endpoint.path}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </aside>

        {selectedEndpoint ? (
          <div className="flex min-w-0 flex-1">
            {endpoints.map((endpoint) => (
              <div className={endpoint.id === selectedEndpoint.id ? 'flex min-w-0 flex-1' : 'hidden'} key={endpoint.id}>
                <EndpointEditor
                  endpoint={endpoint}
                  endpoints={endpoints}
                  isActive={endpoint.id === selectedEndpoint.id}
                  onDelete={() => setEndpointToDelete(endpoint)}
                  onDuplicate={() => duplicateEndpoint(endpoint)}
                  onSave={(updatedEndpoint) => onUpdateEndpoint(projectId, updatedEndpoint)}
                  projectKey={projectKey}
                />
              </div>
            ))}
          </div>
        ) : (
          <main className="grid min-w-0 flex-1 place-items-center p-8">
            <div className="max-w-[360px] text-center">
              <div className="mx-auto mb-4 grid size-11 place-items-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
                <Plus aria-hidden="true" size={20} strokeWidth={1.8} />
              </div>
              <h1 className="text-base leading-6 font-semibold tracking-[-0.015em]">Create your first endpoint</h1>
              <p className="mx-auto mt-1.5 max-w-[330px] text-sm leading-[21px] text-[var(--text-secondary)]">
                Define a method, path, and response. Your mock URL will be ready immediately.
              </p>
              <Button className="mt-5" onClick={() => setDialogIsOpen(true)} size="small" variant="primary">
                <Plus aria-hidden="true" size={12} /> Create endpoint
              </Button>
            </div>
          </main>
        )}
      </div>

      <CreateEndpointDialog
        endpoints={endpoints}
        onCreate={handleCreate}
        onOpenChange={setDialogIsOpen}
        open={dialogIsOpen}
        projectKey={projectKey}
      />
      <DeleteConfirmationDialog
        description="This permanently removes the endpoint and its configured response. Any unsaved changes will also be discarded."
        itemName={endpointToDelete ? `${endpointToDelete.method} ${endpointToDelete.path}` : ''}
        onConfirm={() => { if (endpointToDelete) deleteEndpoint(endpointToDelete) }}
        onOpenChange={(open) => { if (!open) setEndpointToDelete(null) }}
        open={Boolean(endpointToDelete)}
        title="Delete endpoint?"
      />
    </div>
  )
}
