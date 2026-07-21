import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from './client'
import type { PathDetail } from './types'

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

  it('should get a single path detail with nested modules, topics, and resource summaries', async () => {
    const mockPathDetail: PathDetail = {
      _id: '507f1f77bcf86cd799439011',
      name: 'test-path',
      description: 'A learning path',
      technologies: ['Python', 'TypeScript'],
      interests: ['api', 'data'],
      modules: [
        {
          name: 'Module One',
          description: 'First module',
          topics: [
            {
              name: 'Topic Alpha',
              description: 'First topic',
              resources: [
                {
                  _id: '507f1f77bcf86cd799439012',
                  name: 'resource-one',
                  description: 'First resource',
                },
              ],
            },
          ],
        },
      ],
      status: 'active',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-length' ? '100' : null },
      json: async () => mockPathDetail
    })

    const result = await api.getPath('507f1f77bcf86cd799439011')

    expect(result).toEqual(mockPathDetail)
    expect(result.modules?.[0]?.topics?.[0]?.resources?.[0]).toEqual({
      _id: '507f1f77bcf86cd799439012',
      name: 'resource-one',
      description: 'First resource',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/path/507f1f77bcf86cd799439011',
      expect.any(Object)
    )
  })
})
