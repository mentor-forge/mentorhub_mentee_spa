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
      offset: 40,
      size: 10,
      sort_by: 'status',
      order: 'desc'
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/resource?name=test&description=guide&status=active%2Cdraft&sort_by=status&order=desc',
      expect.objectContaining({
        headers: expect.objectContaining({ offset: '40', size: '10' })
      })
    )
  })

  it('should get a single resource', async () => {
    const mockResource = {
      _id: '507f1f77bcf86cd799439011',
      name: 'test-resource'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockResource
    })

    const result = await api.getResource('507f1f77bcf86cd799439011')

    expect(result).toEqual(mockResource)
  })
})