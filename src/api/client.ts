import type { 
  Journey,
  JourneyInput,
  JourneyUpdate,

  Rating,
  RatingInput,
  RatingUpdate,

  Note,
  NoteInput,
  NoteUpdate,

  Event,
  EventInput,

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
    
    // Handle 401 Unauthorized - clear invalid token and redirect to IdP login
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

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T
  }

  return response.json()
}

export const api = {
  // Config
  async getConfig(): Promise<ConfigResponse> {
    return request<ConfigResponse>('/config')
  },

  // Control endpoints
  // 🎯 API methods use InfiniteScrollParams and InfiniteScrollResponse types
  // Shapes used by spa_utils useInfiniteScroll

  async getJourneys(params?: InfiniteScrollParams): Promise<InfiniteScrollResponse<Journey>> {
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.after_id) queryParams.append('after_id', params.after_id)
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.order) queryParams.append('order', params.order)
    
    const query = queryParams.toString()
    return request<InfiniteScrollResponse<Journey>>(`/journey${query ? `?${query}` : ''}`)
  },

  async getJourney(journeyId: string): Promise<Journey> {
    return request<Journey>(`/journey/${journeyId}`)
  },

  async createJourney(data: JourneyInput): Promise<{ _id: string }> {
    return request<{ _id: string }>('/journey', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateJourney(journeyId: string, data: JourneyUpdate): Promise<Journey> {
    return request<Journey>(`/journey/${journeyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },


  async getRatings(params?: InfiniteScrollParams): Promise<InfiniteScrollResponse<Rating>> {
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.after_id) queryParams.append('after_id', params.after_id)
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.order) queryParams.append('order', params.order)
    
    const query = queryParams.toString()
    return request<InfiniteScrollResponse<Rating>>(`/rating${query ? `?${query}` : ''}`)
  },

  async getRating(ratingId: string): Promise<Rating> {
    return request<Rating>(`/rating/${ratingId}`)
  },

  async createRating(data: RatingInput): Promise<{ _id: string }> {
    return request<{ _id: string }>('/rating', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateRating(ratingId: string, data: RatingUpdate): Promise<Rating> {
    return request<Rating>(`/rating/${ratingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },


  async getNotes(params?: InfiniteScrollParams): Promise<InfiniteScrollResponse<Note>> {
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.after_id) queryParams.append('after_id', params.after_id)
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.order) queryParams.append('order', params.order)
    
    const query = queryParams.toString()
    return request<InfiniteScrollResponse<Note>>(`/note${query ? `?${query}` : ''}`)
  },

  async getNote(noteId: string): Promise<Note> {
    return request<Note>(`/note/${noteId}`)
  },

  async createNote(data: NoteInput): Promise<{ _id: string }> {
    return request<{ _id: string }>('/note', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateNote(noteId: string, data: NoteUpdate): Promise<Note> {
    return request<Note>(`/note/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },



  // Create endpoints

  async getEvents(params?: InfiniteScrollParams): Promise<InfiniteScrollResponse<Event>> {
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.after_id) queryParams.append('after_id', params.after_id)
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.order) queryParams.append('order', params.order)
    
    const query = queryParams.toString()
    return request<InfiniteScrollResponse<Event>>(`/event${query ? `?${query}` : ''}`)
  },

  async getEvent(eventId: string): Promise<Event> {
    return request<Event>(`/event/${eventId}`)
  },

  async createEvent(data: EventInput): Promise<{ _id: string }> {
    return request<{ _id: string }>('/event', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },



  // Consume endpoints

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
