import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, ApiError } from './client'
import type { JourneyCompleteInput, JourneyUpdate } from './types'

const mockFetch = vi.fn()
global.fetch = mockFetch

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
    correlation_id: 'corr-123',
  },
  saved: {
    from_ip: '127.0.0.1',
    by_user: 'user1',
    at_time: '2024-01-01T00:00:00Z',
    correlation_id: 'corr-123',
  },
}

function mockJsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name === 'content-length' ? '100' : null) },
    json: async () => body,
  }
}

describe('API Client - Journey Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    localStorage.clear()
    localStorage.setItem('access_token', 'test-token')
  })

  it('should get the authenticated user journey', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockJourney))

    const result = await api.getMyJourney()

    expect(result).toEqual(mockJourney)
    expect(mockFetch).toHaveBeenCalledWith('/api/journey', expect.any(Object))
  })

  it('should update a journey', async () => {
    const update: JourneyUpdate = { status: 'archived' }
    const updatedJourney = { ...mockJourney, status: 'archived' as const }

    mockFetch.mockResolvedValueOnce(mockJsonResponse(updatedJourney))

    const result = await api.updateJourney('507f1f77bcf86cd799439011', update)

    expect(result).toEqual(updatedJourney)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/journey/507f1f77bcf86cd799439011',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(update),
      })
    )
  })

  it('should advance a journey resource from next to now', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockJourney))

    const result = await api.advanceJourneyResource('507f1f77bcf86cd799439012')

    expect(result).toEqual(mockJourney)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/journey/advance/507f1f77bcf86cd799439012',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('should complete a journey resource in now', async () => {
    const input: JourneyCompleteInput = {
      rating: 4,
      note: 'Great resource',
      duration: 'PT1H30M',
    }
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockJourney))

    const result = await api.completeJourneyResource('507f1f77bcf86cd799439012', input)

    expect(result).toEqual(mockJourney)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/journey/complete/507f1f77bcf86cd799439012',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    )
  })

  it('should complete a journey resource without a body', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockJourney))

    await api.completeJourneyResource('507f1f77bcf86cd799439012')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/journey/complete/507f1f77bcf86cd799439012',
      expect.objectContaining({
        method: 'PATCH',
        body: undefined,
      })
    )
  })

  it('should promote a path from later to next', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockJourney))

    const result = await api.promoteJourneyPath('C00000000000000000000006')

    expect(result).toEqual(mockJourney)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/journey/promote/path/C00000000000000000000006',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('should promote a module from a later path to next', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockJourney))

    const result = await api.promoteJourneyModule(
      'C00000000000000000000006',
      'Foundations'
    )

    expect(result).toEqual(mockJourney)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/journey/promote/module/C00000000000000000000006/Foundations',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('should URL-encode module names in promote module requests', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(mockJourney))

    await api.promoteJourneyModule('C00000000000000000000006', 'A/B')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/journey/promote/module/C00000000000000000000006/A%2FB',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('should handle 404 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Resource not found' }),
    })

    await expect(api.getMyJourney()).rejects.toThrow(ApiError)
  })

  it('should handle 401 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'Unauthorized' }),
    })

    await expect(api.getMyJourney()).rejects.toThrow('Unauthorized')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(api.getMyJourney()).rejects.toThrow('Network error')
  })
})
