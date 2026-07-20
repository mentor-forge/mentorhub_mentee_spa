import type {
  Journey,
  JourneyUpdate,
  Resource,
  ResourceDetail,
  AggregationDetail,
  Path,
  ConfigResponse,
  Error,
  ListParams
} from './types'
import { redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'

const API_BASE = '/api'

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
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

  async getResources(params?: ListParams): Promise<Resource[]> {
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.description) queryParams.append('description', params.description)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.url) queryParams.append('url', params.url)
    if (params?.interests) queryParams.append('interests', params.interests)
    if (params?.technologies) queryParams.append('technologies', params.technologies)
    if (params?.skill_level) queryParams.append('skill_level', params.skill_level)
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.order) queryParams.append('order', params.order)

    const query = queryParams.toString()
    return request<Resource[]>(`/resource${query ? `?${query}` : ''}`, {
      headers: {
        offset: String(params?.offset ?? 0),
        size: String(params?.size ?? 20),
      },
    })
  },

  async getResource(resourceId: string): Promise<ResourceDetail> {
    return request<ResourceDetail>(`/resource/${resourceId}`)
  },

  async getAggregationDetail(resourceId: string): Promise<AggregationDetail> {
    return request<AggregationDetail>(`/aggregation/${resourceId}`)
  },

  async getPaths(params?: ListParams): Promise<Path[]> {
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.order) queryParams.append('order', params.order)

    const query = queryParams.toString()
    return request<Path[]>(`/path${query ? `?${query}` : ''}`, {
      headers: {
        offset: String(params?.offset ?? 0),
        size: String(params?.size ?? 20),
      },
    })
  },

  async getPath(pathId: string): Promise<Path> {
    return request<Path>(`/path/${pathId}`)
  },
}

export { ApiError }
