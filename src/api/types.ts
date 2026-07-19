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

export interface JourneyLibraryItem {
  resource_id?: string
  started?: string
  completed?: string
  used?: number
  rating?: number
}

export interface JourneyNowItem {
  resource_id?: string
  added?: string
  started?: string
  used?: number
}

export interface JourneyNextTopic {
  name?: string
  description?: string
  resources?: string[]
}

export interface JourneyNextModule {
  name?: string
  description?: string
  topics?: JourneyNextTopic[]
}

export interface Journey {
  _id: string
  profile_id?: string
  status?: 'active' | 'archived'
  library?: JourneyLibraryItem[]
  now?: JourneyNowItem[]
  next?: JourneyNextModule[]
  later?: string[]
  created: Breadcrumb
  saved: Breadcrumb
}

export interface JourneyUpdate {
  status?: 'active' | 'archived'
  later?: string[]
}

export interface Resource {
  _id: string
  name: string
  description?: string
  status?: string
}

export interface Path {
  _id: string
  name: string
  description?: string
  status?: string
}

export interface ConfigResponse {
  config_items: unknown[]
  versions: unknown[]
  enumerators: unknown[]
  token?: {
    claims?: Record<string, unknown>
  }
}

export interface ListParams {
  offset?: number
  size?: number
  name?: string
  description?: string
  status?: string
  sort_by?: string
  order?: 'asc' | 'desc'
}
