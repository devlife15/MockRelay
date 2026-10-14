import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { createProject, deleteProject, getProjects, projectKeys, updateProject } from '../api/projects'
import type { CreateProjectRequest, Project, UpdateProjectRequest } from '../api/types'
import { AppTopBar } from '../components/AppTopBar'
import { CreateProjectDialog } from '../components/CreateProjectDialog'
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog'
import { EditProjectDialog } from '../components/EditProjectDialog'
import { Button } from '../components/ui/Button'
import { MoreActionsMenu } from '../components/ui/MoreActionsMenu'

function formatUpdatedAt(value: string) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Unknown'
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp)
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const projectsQuery = useQuery({ queryKey: projectKeys.all, queryFn: getProjects })
  const projects = projectsQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(projectKeys.all, (current = []) => [project, ...current])
      queryClient.setQueryData(projectKeys.detail(project.id), project)
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ projectId, request }: { projectId: string; request: UpdateProjectRequest }) =>
      updateProject(projectId, request),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project[]>(projectKeys.all, (current = []) =>
        current.map((project) => project.id === updatedProject.id ? updatedProject : project),
      )
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, projectId) => {
      queryClient.setQueryData<Project[]>(projectKeys.all, (current = []) =>
        current.filter((project) => project.id !== projectId),
      )
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) })
    },
  })

  async function handleCreate(request: CreateProjectRequest) {
    const project = await createMutation.mutateAsync(request)
    setDialogIsOpen(false)
    navigate(`/app/projects/${project.id}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      <AppTopBar />
      <main className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-7 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold leading-[30px] tracking-[-0.025em]">Projects</h1>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Organize related mock endpoints under a shared base URL.</p>
          </div>
          <Button onClick={() => setDialogIsOpen(true)} size="small" variant="primary"><Plus aria-hidden="true" size={12} strokeWidth={2} />New project</Button>
        </div>

        {projectsQuery.isPending ? (
          <section className="grid flex-1 place-items-center text-xs text-[var(--text-muted)]">Loading projects…</section>
        ) : projectsQuery.isError ? (
          <section className="grid flex-1 place-items-center py-12 text-center">
            <div><p className="text-sm font-medium">Could not load projects</p><p className="mt-1 text-xs text-[var(--text-muted)]">Make sure the Spring Boot API is running.</p><Button className="mt-4" onClick={() => projectsQuery.refetch()} size="small">Retry</Button></div>
          </section>
        ) : projects.length === 0 ? (
          <section className="mx-auto grid w-full max-w-[1120px] flex-1 place-items-center py-12">
            <div className="max-w-90 text-center">
              <div className="mx-auto mb-4 grid size-11 place-items-center rounded-lg bg-(--accent-subtle) text-[var(--accent)]"><FolderPlus aria-hidden="true" size={20} strokeWidth={1.7} /></div>
              <h2 className="text-base font-semibold leading-6 tracking-[-0.015em]">Create your first mock project</h2>
              <p className="mx-auto mt-1.5 max-w-[330px] text-sm leading-[21px] text-[var(--text-secondary)]">Group related endpoints together and expose them through one callable base URL.</p>
              <Button className="mt-5" onClick={() => setDialogIsOpen(true)} size="small" variant="primary"><Plus aria-hidden="true" size={12} strokeWidth={2} />New project</Button>
            </div>
          </section>
        ) : (
          <section className="mx-auto mt-8 w-full max-w-[1120px] overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="grid grid-cols-[minmax(220px,1fr)_100px_minmax(190px,0.7fr)_120px_36px] items-center gap-4 border-b border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2 text-[11px] font-semibold text-[var(--text-muted)]"><span>Name</span><span>Endpoints</span><span>Base URL</span><span>Updated</span><span className="sr-only">Actions</span></div>
            {projects.map((project) => (
              <div className="grid min-h-16 cursor-pointer grid-cols-[minmax(220px,1fr)_100px_minmax(190px,0.7fr)_120px_36px] items-center gap-4 border-b border-[var(--border-default)] px-4 last:border-b-0 hover:bg-[var(--bg-hover)]" key={project.id} onClick={() => navigate(`/app/projects/${project.id}`)} onKeyDown={(event) => { if (event.key === 'Enter') navigate(`/app/projects/${project.id}`) }} role="link" tabIndex={0}>
                <div className="min-w-0"><div className="truncate text-[13px] font-semibold">{project.name}</div><div className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{project.description || 'No description'}</div></div>
                <span className="text-xs text-[var(--text-secondary)]">{project.endpointCount}</span>
                <code className="truncate font-mono text-xs text-[var(--text-secondary)]">/mock/{project.projectKey}</code>
                <span className="text-xs text-[var(--text-secondary)]">{formatUpdatedAt(project.updatedAt)}</span>
                <MoreActionsMenu items={[{ icon: <Pencil aria-hidden="true" size={13} />, label: 'Edit project', onSelect: () => setProjectToEdit(project) }, { danger: true, icon: <Trash2 aria-hidden="true" size={13} />, label: 'Delete project', onSelect: () => setProjectToDelete(project), separatorBefore: true }]} label={`More actions for ${project.name}`} />
              </div>
            ))}
          </section>
        )}
      </main>

      <CreateProjectDialog onCreate={handleCreate} onOpenChange={setDialogIsOpen} open={dialogIsOpen} />
      {projectToEdit ? <EditProjectDialog key={projectToEdit.id} onOpenChange={(open) => { if (!open) setProjectToEdit(null) }} onSave={async (request) => { await updateMutation.mutateAsync({ projectId: projectToEdit.id, request }) }} open project={projectToEdit} projects={projects} /> : null}
      <DeleteConfirmationDialog description="This permanently removes the project and every endpoint inside it. This action cannot be undone." itemName={projectToDelete?.name ?? ''} onConfirm={async () => { if (!projectToDelete) return; await deleteMutation.mutateAsync(projectToDelete.id); setProjectToDelete(null) }} onOpenChange={(open) => { if (!open) setProjectToDelete(null) }} open={Boolean(projectToDelete)} title="Delete project?" />
    </div>
  )
}
