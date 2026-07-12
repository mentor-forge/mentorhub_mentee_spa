import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, ApiError } from './client'
import type { JourneyUpdate } from './types'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client - Journey Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    localStorage.clear()
    localStorage.setItem('access_token', 'test-token')
  })

  it('should get the authenticated user journey', async () => {
    const mockJourney = {
      _id: '507f1f77bcf86cd799439011',
      profile_id: '507f1f77bcf86cd799439011',
      status: 'active' as const,
      library: [],
      now: [],
      next: [],
      later: [],
      created: {
        from_ip: '127.0.0.1',
        by_user: 'user1',
        at_time: '2024-01-01T00:00:00Z',
        correlation_id: 'corr-123'
      },
      saved: {
        from_ip: '127.0.0.1',
        by_user: 'user1',
        at_time: '2024-01-01T00:00:00Z',
        correlation_id: 'corr-123'
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockJourney
    })

    const result = await api.getMyJourney()

    expect(result).toEqual(mockJourney)
    expect(mockFetch).toHaveBeenCalledWith('/api/journey', expect.any(Object))
  })

  it('should update a journey', async () => {
    const update: JourneyUpdate = { status: 'archived' }

    const mockJourney = {
      _id: '507f1f77bcf86cd799439011',
      profile_id: '507f1f77bcf86cd799439011',
      status: 'archived' as const,
      created: {
        from_ip: '127.0.0.1',
        by_user: 'user1',
        at_time: '2024-01-01T00:00:00Z',
        correlation_id: 'corr-123'
      },
      saved: {
        from_ip: '127.0.0.1',
        by_user: 'user1',
        at_time: '2024-01-01T00:00:00Z',
        correlation_id: 'corr-123'
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockJourney
    })

    const result = await api.updateJourney('507f1f77bcf86cd799439011', update)

    expect(result).toEqual(mockJourney)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/journey/507f1f77bcf86cd799439011',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(update)
      })
    )
  })

  it('should handle 404 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Resource not found' })
    })

    await expect(api.getMyJourney()).rejects.toThrow(ApiError)
  })

  it('should handle 401 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'Unauthorized' })
    })

    await expect(api.getMyJourney()).rejects.toThrow('Unauthorized')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(api.getMyJourney()).rejects.toThrow('Network error')
  })
})
