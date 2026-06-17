export interface PaginationQuery {
  limit?: number
  offset?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export function paginationDefaults(query: PaginationQuery): { limit: number; offset: number } {
  return {
    limit: Math.min(query.limit ?? 20, 100),
    offset: query.offset ?? 0,
  }
}
