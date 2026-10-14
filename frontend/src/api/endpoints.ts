import { apiRequest } from './client'
import type { CreateEndpointRequest, Endpoint, ResponseHeader, UpdateEndpointRequest } from './types'

type ApiEndpoint = Omit<Endpoint, 'headers' | 'name'> & {
  name: string | null
  headers: Array<Omit<ResponseHeader, 'id'>>
}

export const endpointKeys = {
  list: (projectId: string) => ['projects', projectId, 'endpoints'] as const,
}

function createUiId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `header-${Date.now()}-${Math.random()}`
}

function toEndpoint(endpoint: ApiEndpoint): Endpoint {
  return {
    ...endpoint,
    name: endpoint.name ?? '',
    headers: endpoint.headers.map((header) => ({ ...header, id: createUiId() })),
  }
}

export async function getEndpoints(projectId: string) {
  const endpoints = await apiRequest<ApiEndpoint[]>(`/api/projects/${projectId}/endpoints`)
  return endpoints.map(toEndpoint)
}

export async function createEndpoint(projectId: string, request: CreateEndpointRequest) {
  const endpoint = await apiRequest<ApiEndpoint>(`/api/projects/${projectId}/endpoints`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return toEndpoint(endpoint)
}

export async function updateEndpoint(
  projectId: string,
  endpointId: string,
  request: UpdateEndpointRequest,
) {
  const endpoint = await apiRequest<ApiEndpoint>(
    `/api/projects/${projectId}/endpoints/${endpointId}`,
    { method: 'PUT', body: JSON.stringify(request) },
  )
  return toEndpoint(endpoint)
}

export function deleteEndpoint(projectId: string, endpointId: string) {
  return apiRequest<void>(`/api/projects/${projectId}/endpoints/${endpointId}`, {
    method: 'DELETE',
  })
}

export function toUpdateEndpointRequest(endpoint: Endpoint): UpdateEndpointRequest {
  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    statusCode: endpoint.statusCode,
    contentType: endpoint.contentType,
    headers: endpoint.headers.map(({ name, value, enabled }) => ({ name, value, enabled })),
    body: endpoint.body,
    delayMs: endpoint.delayMs,
  }
}
