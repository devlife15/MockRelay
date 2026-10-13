import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage'
import { ProjectsPage } from './pages/ProjectsPage'

export type Project = {
  id: string
  name: string
  description: string
  key: string
  endpointCount: number
  updatedAt: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ResponseHeader = {
  id: string
  name: string
  value: string
  enabled: boolean
}

export type Endpoint = {
  id: string
  name: string
  method: HttpMethod
  path: string
  statusCode: number
  contentType: string
  delay: number
  body: string
  headers: ResponseHeader[]
}

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [endpointsByProject, setEndpointsByProject] = useState<Record<string, Endpoint[]>>({})

  function createProject(project: Project) {
    setProjects((currentProjects) => [project, ...currentProjects])
  }

  function updateProject(updatedProject: Project) {
    setProjects((currentProjects) => currentProjects.map((project) =>
      project.id === updatedProject.id ? updatedProject : project,
    ))
  }

  function deleteProject(projectId: string) {
    setProjects((currentProjects) => currentProjects.filter((project) => project.id !== projectId))
    setEndpointsByProject((current) => {
      const next = { ...current }
      delete next[projectId]
      return next
    })
  }

  function createEndpoint(projectId: string, endpoint: Endpoint) {
    setEndpointsByProject((current) => ({
      ...current,
      [projectId]: [...(current[projectId] ?? []), endpoint],
    }))
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? { ...project, endpointCount: project.endpointCount + 1, updatedAt: 'Just now' }
          : project,
      ),
    )
  }

  function updateEndpoint(projectId: string, updatedEndpoint: Endpoint) {
    setEndpointsByProject((current) => ({
      ...current,
      [projectId]: (current[projectId] ?? []).map((endpoint) =>
        endpoint.id === updatedEndpoint.id ? updatedEndpoint : endpoint,
      ),
    }))
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId ? { ...project, updatedAt: 'Just now' } : project,
      ),
    )
  }

  function deleteEndpoint(projectId: string, endpointId: string) {
    setEndpointsByProject((current) => ({
      ...current,
      [projectId]: (current[projectId] ?? []).filter((endpoint) => endpoint.id !== endpointId),
    }))
    setProjects((currentProjects) => currentProjects.map((project) =>
      project.id === projectId
        ? { ...project, endpointCount: Math.max(0, project.endpointCount - 1), updatedAt: 'Just now' }
        : project,
    ))
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to="/app" />} />
        <Route
          path="/app"
          element={
            <ProjectsPage
              onCreateProject={createProject}
              onDeleteProject={deleteProject}
              onUpdateProject={updateProject}
              projects={projects}
            />
          }
        />
        <Route
          path="/app/projects/:projectId"
          element={
            <ProjectWorkspacePage
              endpointsByProject={endpointsByProject}
              onCreateEndpoint={createEndpoint}
              onDeleteEndpoint={deleteEndpoint}
              onUpdateEndpoint={updateEndpoint}
              projects={projects}
            />
          }
        />
        <Route path="*" element={<Navigate replace to="/app" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
