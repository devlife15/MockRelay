import { apiRequest } from './client'
import type { StarterApiTemplateSummary } from './types'

export const templateKeys = {
  all: ['project-templates'] as const,
}

export function getProjectTemplates() {
  return apiRequest<StarterApiTemplateSummary[]>('/api/project-templates')
}
