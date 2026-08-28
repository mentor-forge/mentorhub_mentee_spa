import type {
  Journey,
  JourneyCompleteInput,
  JourneyUpdate,
  ResourceDetail,
  AggregationDetail,
  PathDetail,
  ConfigResponse,
  Error
} from './types'
import { redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'

/**
 * Same-origin API base derived from the Vite base, so the browser sends
 * `/mentee/api/...` and this SPA's nginx (or the dev proxy) strips the prefix
 * before the request reaches the Mentee API. Resolved per request so the base
 * is read at call time rather than captured at module load.
 */
function apiBase(): string {
  return `${import.meta.env.BASE_URL}/api`.replace(/\/{2,}/g, '/')
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Error
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${apiBase()}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData: Error | null = null
    try {
      errorData = await response.json()
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      const { logout } = useAuth()
      logout()
      redirectToIdpLogin()
    }

    throw new ApiError(
      errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData || undefined
    )
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T
  }

  return response.json()
}

export const api = {
  async getConfig(): Promise<ConfigResponse> {
    return request<ConfigResponse>('/config')
  },

  async getMyJourney(): Promise<Journey> {
    return request<Journey>('/journey')
  },

  async updateJourney(journeyId: string, data: JourneyUpdate): Promise<Journey> {
    return request<Journey>(`/journey/${journeyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async advanceJourneyResource(resourceId: string): Promise<Journey> {
    return request<Journey>(`/journey/advance/${resourceId}`, {
      method: 'PATCH',
    })
  },

  async completeJourneyResource(
    resourceId: string,
    data?: JourneyCompleteInput
  ): Promise<Journey> {
    return request<Journey>(`/journey/complete/${resourceId}`, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async promoteJourneyPath(pathId: string): Promise<Journey> {
    return request<Journey>(`/journey/promote/path/${pathId}`, {
      method: 'PATCH',
    })
  },

  async promoteJourneyModule(pathId: string, moduleName: string): Promise<Journey> {
    return request<Journey>(
      `/journey/promote/module/${pathId}/${encodeURIComponent(moduleName)}`,
      {
        method: 'PATCH',
      }
    )
  },

  async getResource(resourceId: string): Promise<ResourceDetail> {
    return request<ResourceDetail>(`/resource/${resourceId}`)
  },

  async getAggregationDetail(resourceId: string): Promise<AggregationDetail> {
    return request<AggregationDetail>(`/aggregation/${resourceId}`)
  },

  async getPath(pathId: string): Promise<PathDetail> {
    return request<PathDetail>(`/path/${pathId}`)
  },
}

export { ApiError }
