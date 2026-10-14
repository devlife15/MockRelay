import { apiRequest } from './client'
import type { CreateProjectRequest, Project, UpdateProjectRequest } from './types'

export const projectKeys = {
  all: ['projects'] as const,
  detail: (projectId: string) => ['projects', projectId] as const,
}

export function getProjects() {
  return apiRequest<Project[]>('/api/projects')
}

export function getProject(projectId: string) {
  return apiRequest<Project>(`/api/projects/${projectId}`)
}

export function createProject(request: CreateProjectRequest) {
  return apiRequest<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function updateProject(projectId: string, request: UpdateProjectRequest) {
  return apiRequest<Project>(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export function deleteProject(projectId: string) {
  return apiRequest<void>(`/api/projects/${projectId}`, { method: 'DELETE' })
}
