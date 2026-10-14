import { apiRequest } from './client'
import type {
  CreateResponseScenarioRequest,
  ResponseHeader,
  ResponseScenario,
  UpdateResponseScenarioRequest,
} from './types'

type ApiResponseScenario = Omit<ResponseScenario, 'headers'> & {
  headers: Array<Omit<ResponseHeader, 'id'>>
}

export const scenarioKeys = {
  list: (projectId: string, endpointId: string) => [
    'projects', projectId, 'endpoints', endpointId, 'scenarios',
  ] as const,
}

function createUiId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `header-${Date.now()}-${Math.random()}`
}

function toScenario(scenario: ApiResponseScenario): ResponseScenario {
  return {
    ...scenario,
    headers: scenario.headers.map((header) => ({ ...header, id: createUiId() })),
  }
}

function collectionPath(projectId: string, endpointId: string) {
  return `/api/projects/${projectId}/endpoints/${endpointId}/scenarios`
}

export async function getScenarios(projectId: string, endpointId: string) {
  const scenarios = await apiRequest<ApiResponseScenario[]>(collectionPath(projectId, endpointId))
  return scenarios.map(toScenario)
}

export async function createScenario(
  projectId: string,
  endpointId: string,
  request: CreateResponseScenarioRequest,
) {
  const scenario = await apiRequest<ApiResponseScenario>(collectionPath(projectId, endpointId), {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return toScenario(scenario)
}

export async function updateScenario(
  projectId: string,
  endpointId: string,
  scenarioId: string,
  request: UpdateResponseScenarioRequest,
) {
  const scenario = await apiRequest<ApiResponseScenario>(
    `${collectionPath(projectId, endpointId)}/${scenarioId}`,
    { method: 'PUT', body: JSON.stringify(request) },
  )
  return toScenario(scenario)
}

export async function activateScenario(
  projectId: string,
  endpointId: string,
  scenarioId: string,
) {
  const scenario = await apiRequest<ApiResponseScenario>(
    `${collectionPath(projectId, endpointId)}/${scenarioId}/activate`,
    { method: 'PUT' },
  )
  return toScenario(scenario)
}

export function deleteScenario(projectId: string, endpointId: string, scenarioId: string) {
  return apiRequest<void>(`${collectionPath(projectId, endpointId)}/${scenarioId}`, {
    method: 'DELETE',
  })
}

export function toScenarioRequest(
  scenario: Pick<ResponseScenario, 'name' | 'statusCode' | 'contentType' | 'headers' | 'body' | 'delayMs'>,
): UpdateResponseScenarioRequest {
  return {
    name: scenario.name,
    statusCode: scenario.statusCode,
    contentType: scenario.contentType,
    headers: scenario.headers.map(({ name, value, enabled }) => ({ name, value, enabled })),
    body: scenario.body,
    delayMs: scenario.delayMs,
  }
}
