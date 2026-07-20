import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from './client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client - Resource Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    localStorage.clear()
    localStorage.setItem('access_token', 'test-token')
  })

  it('should get all resources', async () => {
    const mockResources = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'test-resource',
        description: 'Test description',
        status: 'active'
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockResources
    })

    const result = await api.getResources()

    expect(result).toEqual(mockResources)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/resource',
      expect.objectContaining({
        headers: expect.objectContaining({ offset: '0', size: '20' })
      })
    )
  })

  it('should get resources with query filters and pagination headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => []
    })

    await api.getResources({
      name: 'test',
      description: 'guide',
      status: 'active,draft',
      url: 'example.com',
      interests: 'api,sre',
      technologies: 'Python,React',
      skill_level: 'Apprentice,Craftsperson',
      offset: 40,
      size: 10,
      sort_by: 'status',
      order: 'desc'
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/resource?name=test&description=guide&status=active%2Cdraft&url=example.com&interests=api%2Csre&technologies=Python%2CReact&skill_level=Apprentice%2CCraftsperson&sort_by=status&order=desc',
      expect.objectContaining({
        headers: expect.objectContaining({ offset: '40', size: '10' })
      })
    )
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
      '/api/resource/507f1f77bcf86cd799439011',
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
      '/api/aggregation/507f1f77bcf86cd799439011',
      expect.any(Object)
    )
  })
})