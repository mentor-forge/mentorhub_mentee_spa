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

export interface JourneyCompleteInput {
  rating?: number
  note?: string
  duration?: string
}

export interface Resource {
  _id: string
  name: string
  description?: string
  url?: string
  type?: string
  cost?: string
  skill_level?: string
  interests?: string[]
  technologies?: string[]
  last_verified?: string
  status?: string
  created?: Breadcrumb
  saved?: Breadcrumb
}

export interface ResourceAggregation {
  _id: string
  resource_id: string
  note_count?: number
  completions?: number
  hits?: number
  duration?: string
  rating_count?: number
  rating_sum: number
  created: Breadcrumb
  last_saved: Breadcrumb
}

export interface Note {
  _id: string
  resource_id: string
  profile_id?: string
  note?: string
  status?: 'active' | 'archived'
  created?: Breadcrumb
  saved?: Breadcrumb
}

export interface ResourceDetail {
  resource: Resource
  aggregation: ResourceAggregation | null
  notes: Note[]
}

export interface AggregationDetail {
  aggregation: ResourceAggregation
  notes: Note[]
}

export interface Path {
  _id: string
  name: string
  description?: string
  status?: string
}

/** Minimal Resource projection embedded in Path detail responses. */
export interface PathResourceSummary {
  _id: string
  name?: string
  description?: string
}

/** Topic within a Path module, with enriched resource summaries. */
export interface PathTopicDetail {
  name?: string
  description?: string
  resources?: PathResourceSummary[]
}

/** Module within a Path detail document. */
export interface PathModuleDetail {
  name?: string
  description?: string
  topics?: PathTopicDetail[]
}

/** Full Path document from GET /api/path/{path_id} (read-only detail). */
export interface PathDetail {
  _id: string
  name: string
  description?: string
  technologies?: string[]
  interests?: string[]
  modules?: PathModuleDetail[]
  status?: string
  created?: Breadcrumb
  saved?: Breadcrumb
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
  url?: string
  interests?: string
  technologies?: string
  skill_level?: string
  sort_by?: string
  order?: 'asc' | 'desc'
}
