export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ValidationError = {
  field: string
  message: string
}

export type ProblemDetail = {
  detail?: string
  errors?: ValidationError[]
  status: number
  title?: string
}

export type Project = {
  id: string
  name: string
  description: string | null
  projectKey: string
  endpointCount: number
  createdAt: string
  updatedAt: string
}

export type CreateProjectRequest = {
  name: string
  description: string | null
  projectKey: string
}

export type UpdateProjectRequest = CreateProjectRequest

export type ResponseHeader = {
  id: string
  name: string
  value: string
  enabled: boolean
}

export type ResponseHeaderRequest = Omit<ResponseHeader, 'id'>

export type Endpoint = {
  id: string
  projectId: string
  name: string
  method: HttpMethod
  path: string
  statusCode: number
  contentType: string
  headers: ResponseHeader[]
  body: string
  delayMs: number
  createdAt: string
  updatedAt: string
}

export type CreateEndpointRequest = {
  name: string
  method: HttpMethod
  path: string
}

export type UpdateEndpointRequest = {
  name: string
  method: HttpMethod
  path: string
  statusCode: number
  contentType: string
  headers: ResponseHeaderRequest[]
  body: string
  delayMs: number
}

export type ResponseScenario = {
  id: string
  endpointId: string
  name: string
  active: boolean
  statusCode: number
  contentType: string
  headers: ResponseHeader[]
  body: string
  delayMs: number
  createdAt: string
  updatedAt: string
}

export type CreateResponseScenarioRequest = {
  name: string
  statusCode: number
  contentType: string
  headers: ResponseHeaderRequest[]
  body: string
  delayMs: number
}

export type UpdateResponseScenarioRequest = CreateResponseScenarioRequest
