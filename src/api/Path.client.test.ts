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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockPaths
    })

    const result = await api.getPaths()

    expect(result).toEqual(mockPaths)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/path',
      expect.objectContaining({
        headers: expect.objectContaining({ offset: '0', size: '20' })
      })
    )
  })

  it('should get paths with query filters and pagination headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => []
    })

    await api.getPaths({ name: 'test', offset: 20, size: 10, sort_by: 'name', order: 'desc' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/path?name=test&sort_by=name&order=desc',
      expect.objectContaining({
        headers: expect.objectContaining({ offset: '20', size: '10' })
      })
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