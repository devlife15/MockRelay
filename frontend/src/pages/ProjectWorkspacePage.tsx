import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getErrorMessage } from '../api/client'
import { createEndpoint, deleteEndpoint, endpointKeys, getEndpoints, toUpdateEndpointRequest, updateEndpoint } from '../api/endpoints'
import { getProject, projectKeys } from '../api/projects'
import type { CreateEndpointRequest, Endpoint } from '../api/types'
import { AppTopBar } from '../components/AppTopBar'
import { CreateEndpointDialog } from '../components/CreateEndpointDialog'
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog'
import { EndpointEditor } from '../components/EndpointEditor'
import { EndpointSidebar } from '../components/EndpointSidebar'
import { Button } from '../components/ui/Button'

export function ProjectWorkspacePage() {
  const { projectId = '' } = useParams()
  const queryClient = useQueryClient()
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [endpointToDelete, setEndpointToDelete] = useState<Endpoint | null>(null)
  const [operationError, setOperationError] = useState('')

  const projectQuery = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  })
  const endpointsQuery = useQuery({
    queryKey: endpointKeys.list(projectId),
    queryFn: () => getEndpoints(projectId),
    enabled: Boolean(projectId),
  })

  const project = projectQuery.data
  const endpoints = endpointsQuery.data ?? []
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

  function updateEndpointCache(updatedEndpoint: Endpoint) {
    queryClient.setQueryData<Endpoint[]>(endpointKeys.list(projectId), (current = []) =>
      current.map((endpoint) => endpoint.id === updatedEndpoint.id ? updatedEndpoint : endpoint),
    )
  }

  function refreshProjectSummaries() {
    queryClient.invalidateQueries({ queryKey: projectKeys.all, exact: true })
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId), exact: true })
  }

  const createMutation = useMutation({
    mutationFn: (request: CreateEndpointRequest) => createEndpoint(projectId, request),
    onSuccess: (endpoint) => {
      queryClient.setQueryData<Endpoint[]>(endpointKeys.list(projectId), (current = []) => [...current, endpoint])
      refreshProjectSummaries()
    },
  })
  const updateMutation = useMutation({
    mutationFn: (endpoint: Endpoint) => updateEndpoint(
      projectId,
      endpoint.id,
      toUpdateEndpointRequest(endpoint),
    ),
    onSuccess: (endpoint) => {
      updateEndpointCache(endpoint)
      refreshProjectSummaries()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (endpointId: string) => deleteEndpoint(projectId, endpointId),
    onSuccess: (_, endpointId) => {
      queryClient.setQueryData<Endpoint[]>(endpointKeys.list(projectId), (current = []) =>
        current.filter((endpoint) => endpoint.id !== endpointId),
      )
      refreshProjectSummaries()
    },
  })
  const duplicateMutation = useMutation({
    mutationFn: async (source: Endpoint) => {
      let suffix = 1
      let path = `${source.path}-copy`
      while (endpoints.some((endpoint) => endpoint.method === source.method && endpoint.path === path)) {
        suffix += 1
        path = `${source.path}-copy-${suffix}`
      }

      const created = await createEndpoint(projectId, {
        name: `${source.name || source.path} copy`,
        method: source.method,
        path,
      })

      try {
        return await updateEndpoint(projectId, created.id, {
          ...toUpdateEndpointRequest(source),
          name: created.name,
          path,
        })
      } catch (error) {
        await deleteEndpoint(projectId, created.id).catch(() => undefined)
        throw error
      }
    },
    onSuccess: (endpoint) => {
      queryClient.setQueryData<Endpoint[]>(endpointKeys.list(projectId), (current = []) => [...current, endpoint])
      setSelectedEndpointId(endpoint.id)
      refreshProjectSummaries()
    },
  })

  async function handleCreate(request: CreateEndpointRequest) {
    const endpoint = await createMutation.mutateAsync(request)
    setSelectedEndpointId(endpoint.id)
    setDialogIsOpen(false)
  }

  async function handleDuplicate(endpoint: Endpoint) {
    setOperationError('')
    try {
      await duplicateMutation.mutateAsync(endpoint)
    } catch (error) {
      setOperationError(getErrorMessage(error))
    }
  }

  async function handleDelete(endpoint: Endpoint) {
    const index = endpoints.findIndex((item) => item.id === endpoint.id)
    await deleteMutation.mutateAsync(endpoint.id)
    if (selectedEndpoint?.id === endpoint.id) {
      setSelectedEndpointId(endpoints[index + 1]?.id ?? endpoints[index - 1]?.id ?? null)
    }
    setEndpointToDelete(null)
  }

  if (projectQuery.isPending || endpointsQuery.isPending) {
    return <div className="flex h-screen flex-col bg-[var(--bg-app)] text-[var(--text-primary)]"><AppTopBar /><main className="grid flex-1 place-items-center text-xs text-[var(--text-muted)]">Loading project workspace…</main></div>
  }

  if (projectQuery.isError || endpointsQuery.isError || !project) {
    return <div className="flex h-screen flex-col bg-[var(--bg-app)] text-[var(--text-primary)]"><AppTopBar /><main className="grid flex-1 place-items-center text-center"><div><p className="text-sm font-medium">Could not load this project</p><p className="mt-1 text-xs text-[var(--text-muted)]">The project may not exist, or the API may be unavailable.</p><div className="mt-4 flex justify-center gap-2"><Button onClick={() => { projectQuery.refetch(); endpointsQuery.refetch() }} size="small">Retry</Button><Link className="inline-flex h-7 items-center rounded-md px-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]" to="/app">All projects</Link></div></div></main></div>
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      <AppTopBar />
      <div className="flex min-h-0 flex-1">
        <EndpointSidebar endpoints={endpoints} key={projectId} onCreate={() => setDialogIsOpen(true)} onDelete={setEndpointToDelete} onDuplicate={handleDuplicate} onSelect={setSelectedEndpointId} operationError={operationError} projectId={projectId} projectKey={project.projectKey} projectName={project.name} selectedEndpointId={selectedEndpoint?.id} />

        {selectedEndpoint ? (
          <div className="flex min-w-0 flex-1">
            {endpoints.map((endpoint) => <div className={endpoint.id === selectedEndpoint.id ? 'flex min-w-0 flex-1' : 'hidden'} key={endpoint.id}><EndpointEditor endpoint={endpoint} endpoints={endpoints} isActive={endpoint.id === selectedEndpoint.id} onDelete={() => setEndpointToDelete(endpoint)} onDuplicate={() => handleDuplicate(endpoint)} onSave={(updatedEndpoint) => updateMutation.mutateAsync(updatedEndpoint)} projectKey={project.projectKey} /></div>)}
          </div>
        ) : (
          <main className="grid min-w-0 flex-1 place-items-center p-8"><div className="max-w-[360px] text-center"><div className="mx-auto mb-4 grid size-11 place-items-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]"><Plus aria-hidden="true" size={20} strokeWidth={1.8} /></div><h1 className="text-base font-semibold leading-6 tracking-[-0.015em]">Create your first endpoint</h1><p className="mx-auto mt-1.5 max-w-[330px] text-sm leading-[21px] text-[var(--text-secondary)]">Define a method, path, and response. Your mock URL will be ready immediately.</p><Button className="mt-5" onClick={() => setDialogIsOpen(true)} size="small" variant="primary"><Plus aria-hidden="true" size={12} /> Create endpoint</Button></div></main>
        )}
      </div>

      <CreateEndpointDialog endpoints={endpoints} onCreate={handleCreate} onOpenChange={setDialogIsOpen} open={dialogIsOpen} projectKey={project.projectKey} />
      <DeleteConfirmationDialog description="This permanently removes the endpoint and its configured response. Any unsaved changes will also be discarded." itemName={endpointToDelete ? `${endpointToDelete.method} ${endpointToDelete.path}` : ''} onConfirm={async () => { if (endpointToDelete) await handleDelete(endpointToDelete) }} onOpenChange={(open) => { if (!open) setEndpointToDelete(null) }} open={Boolean(endpointToDelete)} title="Delete endpoint?" />
    </div>
  )
}
