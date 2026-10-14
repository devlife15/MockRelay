import type { ProblemDetail } from './types'

export class ApiError extends Error {
  readonly problem: ProblemDetail

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title || `Request failed with status ${problem.status}`)
    this.name = 'ApiError'
    this.problem = problem
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(path, { ...options, headers })
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not reach the MockRelay API: ${error.message}`
        : 'Could not reach the MockRelay API',
      { cause: error },
    )
  }

  if (!response.ok) {
    let problem: ProblemDetail
    try {
      problem = await response.json() as ProblemDetail
    } catch {
      problem = { status: response.status, title: response.statusText }
    }
    throw new ApiError(problem)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const fieldMessage = error.problem.errors?.[0]?.message
    return fieldMessage || error.problem.detail || error.problem.title || error.message
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred'
}
