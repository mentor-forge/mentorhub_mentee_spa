// Type definitions based on OpenAPI spec

export interface Error {
  error: string
}

export interface Breadcrumb {
  from_ip: string
  by_user: string
  at_time: string
  correlation_id: string
}


// Journey Domain
export interface Journey {
  _id: string
  name: string
  description?: string
  status?: 'active' | 'archived'
  created: Breadcrumb
  saved: Breadcrumb
}

export interface JourneyInput {
  name: string
  description?: string
  status?: 'active' | 'archived'
}

export interface JourneyUpdate {
  name?: string
  description?: string
  status?: 'active' | 'archived'
}

// Rating Domain
export interface Rating {
  _id: string
  name: string
  description?: string
  status?: 'active' | 'archived'
  created: Breadcrumb
  saved: Breadcrumb
}

export interface RatingInput {
  name: string
  description?: string
  status?: 'active' | 'archived'
}

export interface RatingUpdate {
  name?: string
  description?: string
  status?: 'active' | 'archived'
}

// Note Domain
export interface Note {
  _id: string
  name: string
  description?: string
  status?: 'active' | 'archived'
  created: Breadcrumb
  saved: Breadcrumb
}

export interface NoteInput {
  name: string
  description?: string
  status?: 'active' | 'archived'
}

export interface NoteUpdate {
  name?: string
  description?: string
  status?: 'active' | 'archived'
}


// Event Domain
export interface Event {
  _id: string
  name: string
  description?: string
  status?: string
  created: Breadcrumb
}

export interface EventInput {
  name: string
  description?: string
  status?: string
}


// Resource Domain
export interface Resource {
  _id: string
  name: string
  description?: string
  status?: string
}

// Path Domain
export interface Path {
  _id: string
  name: string
  description?: string
  status?: string
}


// Configuration
export interface ConfigResponse {
  config_items: unknown[]
  versions: unknown[]
  enumerators: unknown[]
  token?: {
    claims?: Record<string, unknown>
  }
}

// Infinite Scroll
export interface InfiniteScrollParams {
  name?: string
  after_id?: string
  limit?: number
  sort_by?: string
  order?: 'asc' | 'desc'
}

export interface InfiniteScrollResponse<T> {
  items: T[]
  limit: number
  has_more: boolean
  next_cursor: string | null
}
