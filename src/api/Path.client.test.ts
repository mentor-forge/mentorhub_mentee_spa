import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from './client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client - Path Endpoints', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    localStorage.clear()
    localStorage.setItem('access_token', 'test-token')
  })

  it('should get all paths', async () => {
    const mockPaths = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'test-path',
        description: 'Test description',
        status: 'active'
      }
    ]

    const mockResponse = {
      items: mockPaths,
      limit: 20,
      has_more: false,
      next_cursor: null
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockResponse
    })

    const result = await api.getPaths()

    expect(result).toEqual(mockResponse)
  })

  it('should get paths with name query', async () => {
    const mockResponse = {
      items: [],
      limit: 20,
      has_more: false,
      next_cursor: null
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockResponse
    })

    await api.getPaths({ name: 'test' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/path?name=test',
      expect.any(Object)
    )
  })

  it('should get a single path', async () => {
    const mockPath = {
      _id: '507f1f77bcf86cd799439011',
      name: 'test-path'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockPath
    })

    const result = await api.getPath('507f1f77bcf86cd799439011')

    expect(result).toEqual(mockPath)
  })
})