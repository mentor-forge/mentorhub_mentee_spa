import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { api } from './client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client - Resource Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    localStorage.clear()
    localStorage.setItem('access_token', 'test-token')
    // The app is mounted under the `/mentee/` Vite base; vitest resolves BASE_URL to `/`.
    vi.stubEnv('BASE_URL', '/mentee/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should get a single resource detail', async () => {
    const mockResourceDetail = {
      resource: {
        _id: '507f1f77bcf86cd799439011',
        name: 'test-resource',
        description: 'Test description',
        status: 'active',
      },
      aggregation: null,
      notes: [],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockResourceDetail
    })

    const result = await api.getResource('507f1f77bcf86cd799439011')

    expect(result).toEqual(mockResourceDetail)
    expect(mockFetch).toHaveBeenCalledWith(
      '/mentee/api/resource/507f1f77bcf86cd799439011',
      expect.any(Object)
    )
  })

  it('should get aggregation detail for a resource', async () => {
    const mockAggregationDetail = {
      aggregation: {
        _id: '507f1f77bcf86cd799439012',
        resource_id: '507f1f77bcf86cd799439011',
        note_count: 2,
        completions: 5,
        hits: 12,
        duration: 'PT2H30M',
        rating_count: 5,
        rating_sum: 20,
        created: {
          from_ip: '127.0.0.1',
          by_user: 'system',
          at_time: '2024-01-01T00:00:00Z',
          correlation_id: 'abc',
        },
        last_saved: {
          from_ip: '127.0.0.1',
          by_user: 'system',
          at_time: '2024-01-02T00:00:00Z',
          correlation_id: 'def',
        },
      },
      notes: [
        {
          _id: '507f1f77bcf86cd799439013',
          resource_id: '507f1f77bcf86cd799439011',
          note: 'Helpful resource',
          status: 'active',
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockAggregationDetail
    })

    const result = await api.getAggregationDetail('507f1f77bcf86cd799439011')

    expect(result).toEqual(mockAggregationDetail)
    expect(mockFetch).toHaveBeenCalledWith(
      '/mentee/api/aggregation/507f1f77bcf86cd799439011',
      expect.any(Object)
    )
  })
})