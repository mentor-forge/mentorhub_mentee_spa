import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
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
    // The app is mounted under the `/mentee/` Vite base; vitest resolves BASE_URL to `/`.
    vi.stubEnv('BASE_URL', '/mentee/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
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
      '/mentee/api/path/507f1f77bcf86cd799439011',
      expect.any(Object)
    )
  })
})
