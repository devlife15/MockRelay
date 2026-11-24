import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookBookmark,
  FileText,
  FolderPlus,
  Layers2,
  Pencil,
  Plus,
  SquareArrowOutUpRight,
  Trash2,
} from 'runeicons-react'
import type { IconComponent } from 'runeicons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { createProject, deleteProject, getProjects, projectKeys, updateProject } from '../api/projects'
import type { CreateProjectRequest, Project, UpdateProjectRequest } from '../api/types'
import { AppTopBar } from '../components/AppTopBar'
import { CreateProjectDialog } from '../components/CreateProjectDialog'
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog'
import { EditProjectDialog } from '../components/EditProjectDialog'
import { AppIcon } from '../components/ui/AppIcon'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
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

function getDashboardGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const documentationLinks: Array<{
  description: string
  href: string
  icon: IconComponent
  title: string
}> = [
  {
    description: 'Create projects, configure endpoints, and call a stable mock URL.',
    href: 'https://github.com/devlife15/MockRelay#why-mockrelay',
    icon: BookBookmark,
    title: 'Getting started',
  },
  {
    description: 'Understand the management and runtime request flows.',
    href: 'https://github.com/devlife15/MockRelay#architecture',
    icon: FileText,
    title: 'Architecture overview',
  },
  {
    description: 'Explore the template format and reusable API contracts.',
    href: 'https://github.com/devlife15/MockRelay/blob/main/docs/starter-api-template-format.md',
    icon: Layers2,
    title: 'Starter API templates',
  },
]

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
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-8 pb-14 sm:px-6 lg:px-8 lg:pt-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_288px]">
          <div className="min-w-0">
            <section>
              <p className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]"><span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--accent)]" />{new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date())}</p>
              <h1 className="mt-1.5 text-[28px] leading-tight font-semibold tracking-[-0.035em] sm:text-[32px]">{getDashboardGreeting()}, Ayan</h1>
              <p className="mt-1.5 max-w-[620px] text-sm leading-6 text-[var(--text-secondary)]">Build and manage the mock APIs your clients depend on.</p>
            </section>

            {projectsQuery.isPending ? (
              <section className="grid min-h-72 place-items-center py-20 text-sm text-[var(--text-muted)]">Loading projects…</section>
            ) : projectsQuery.isError ? (
              <section className="grid min-h-72 place-items-center py-12 text-center">
                <Card className="w-full max-w-[400px] p-7"><p className="text-base font-semibold">Could not load projects</p><p className="mt-1.5 text-sm text-[var(--text-secondary)]">Make sure the Spring Boot API is running.</p><Button className="mt-5" onClick={() => projectsQuery.refetch()} size="small">Retry</Button></Card>
              </section>
            ) : projects.length === 0 ? (
              <section className="py-10">
                <Card className="w-full p-9 text-center">
                  <div className="mx-auto mb-5 grid size-11 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"><AppIcon icon={FolderPlus} size={20} /></div>
                  <h2 className="text-xl font-semibold tracking-[-0.025em]">Create your first mock project</h2>
                  <p className="mx-auto mt-2 max-w-[360px] text-sm leading-6 text-[var(--text-secondary)]">Group related endpoints together and expose them through one callable base URL.</p>
                  <Button className="mt-6" onClick={() => setDialogIsOpen(true)} variant="primary"><AppIcon icon={Plus} size={16} />New project</Button>
                </Card>
              </section>
            ) : (
              <section className="pt-9">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                  <div><h2 className="text-base font-semibold tracking-[-0.015em]">Your projects</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">{projects.length} {projects.length === 1 ? 'project' : 'projects'} in this workspace</p></div>
                  <Button className="shrink-0" onClick={() => setDialogIsOpen(true)} variant="primary"><AppIcon icon={Plus} size={16} />New project</Button>
                </div>
                <Card className="overflow-hidden">
              <div className="hidden grid-cols-[minmax(220px,1fr)_120px_minmax(190px,0.7fr)_110px_40px] items-center gap-4 border-b border-[var(--border-default)] bg-[var(--bg-subtle)] px-5 py-2.5 text-[11px] font-medium text-[var(--text-muted)] md:grid">
                <span>Name</span>
                <span>Endpoints</span>
                <span>Base URL</span>
                <span>Updated</span>
                <span className="sr-only">Actions</span>
              </div>
              {projects.map((project, index) => (
                <article className={`grid cursor-pointer grid-cols-[minmax(0,1fr)_40px] items-center gap-4 px-5 py-4 outline-none transition-colors hover:bg-[var(--bg-hover)] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-strong)] md:grid-cols-[minmax(220px,1fr)_120px_minmax(190px,0.7fr)_110px_40px] ${index < projects.length - 1 ? 'border-b border-[var(--border-default)]' : ''}`} key={project.id} onClick={() => navigate(`/app/projects/${project.id}`)} onKeyDown={(event) => { if (event.key === 'Enter') navigate(`/app/projects/${project.id}`) }} role="link" tabIndex={0}>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold tracking-[-0.01em]">{project.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{project.description || 'A configurable mock API project.'}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-[var(--text-secondary)] md:hidden">
                      <span>{project.endpointCount} {project.endpointCount === 1 ? 'endpoint' : 'endpoints'}</span>
                      <code>/mock/{project.projectKey}</code>
                      <span className="opacity-65">{formatUpdatedAt(project.updatedAt)}</span>
                    </div>
                  </div>
                  <span className="hidden text-xs text-[var(--text-secondary)] md:block">{project.endpointCount}</span>
                  <code className="hidden truncate font-mono text-xs text-[var(--text-secondary)] md:block">/mock/{project.projectKey}</code>
                  <span className="hidden text-xs text-[var(--text-muted)] md:block">{formatUpdatedAt(project.updatedAt)}</span>
                  <MoreActionsMenu className="shrink-0" items={[{ icon: <AppIcon icon={Pencil} size={13} />, label: 'Edit project', onSelect: () => setProjectToEdit(project) }, { danger: true, icon: <AppIcon icon={Trash2} size={13} />, label: 'Delete project', onSelect: () => setProjectToDelete(project), separatorBefore: true }]} label={`More actions for ${project.name}`} />
                </article>
              ))}
                </Card>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-8">
            <Card className="overflow-hidden">
              <div className="border-b border-[var(--border-default)] px-4 py-3.5"><h2 className="text-sm font-semibold">Documentation</h2><p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Learn the core MockRelay workflows.</p></div>
              <div className="divide-y divide-[var(--border-default)]">
                {documentationLinks.map(({ description, href, icon: Icon, title }) => (
                  <a className="group flex gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--bg-hover)]" href={href} key={title} rel="noreferrer" target="_blank">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"><AppIcon icon={Icon} size={13} /></span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-xs font-semibold">{title}<AppIcon className="text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" icon={SquareArrowOutUpRight} size={11} /></span><span className="mt-1 block text-[11px] leading-4 text-[var(--text-muted)]">{description}</span></span>
                  </a>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-sm font-semibold">Start from a template</h2>
              <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">Create a project with realistic endpoints and response scenarios already configured.</p>
              <Button className="mt-4 w-full" onClick={() => setDialogIsOpen(true)} size="small">Browse starter APIs</Button>
            </Card>
          </aside>
        </div>
      </main>

      <CreateProjectDialog onCreate={handleCreate} onOpenChange={setDialogIsOpen} open={dialogIsOpen} />
      {projectToEdit ? <EditProjectDialog key={projectToEdit.id} onOpenChange={(open) => { if (!open) setProjectToEdit(null) }} onSave={async (request) => { await updateMutation.mutateAsync({ projectId: projectToEdit.id, request }) }} open project={projectToEdit} projects={projects} /> : null}
      <DeleteConfirmationDialog description="This permanently removes the project and every endpoint inside it. This action cannot be undone." itemName={projectToDelete?.name ?? ''} onConfirm={async () => { if (!projectToDelete) return; await deleteMutation.mutateAsync(projectToDelete.id); setProjectToDelete(null) }} onOpenChange={(open) => { if (!open) setProjectToDelete(null) }} open={Boolean(projectToDelete)} title="Delete project?" />
    </div>
  )
}
