import type {
  Journey,
  JourneyUpdate,
  Resource,
  Path,
  ConfigResponse,
  Error,
  InfiniteScrollParams,
  InfiniteScrollResponse
} from './types'
import { redirectToIdpLogin } from '@mentor-forge/mentorhub_spa_utils'

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
      localStorage.removeItem('access_token')
      localStorage.removeItem('token_expires_at')
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

  async getResources(params?: InfiniteScrollParams): Promise<InfiniteScrollResponse<Resource>> {
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.after_id) queryParams.append('after_id', params.after_id)
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.order) queryParams.append('order', params.order)

    const query = queryParams.toString()
    return request<InfiniteScrollResponse<Resource>>(`/resource${query ? `?${query}` : ''}`)
  },

  async getResource(resourceId: string): Promise<Resource> {
    return request<Resource>(`/resource/${resourceId}`)
  },

  async getPaths(params?: InfiniteScrollParams): Promise<InfiniteScrollResponse<Path>> {
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.after_id) queryParams.append('after_id', params.after_id)
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.order) queryParams.append('order', params.order)

    const query = queryParams.toString()
    return request<InfiniteScrollResponse<Path>>(`/path${query ? `?${query}` : ''}`)
  },

  async getPath(pathId: string): Promise<Path> {
    return request<Path>(`/path/${pathId}`)
  },
}

export { ApiError }
