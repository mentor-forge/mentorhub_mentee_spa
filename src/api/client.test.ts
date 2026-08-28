import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'
import { api } from './client'

vi.mock('@mentor-forge/mentorhub_spa_utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mentor-forge/mentorhub_spa_utils')>()
  return {
    ...actual,
    redirectToIdpLogin: vi.fn(),
    useAuth: vi.fn(() => ({
      logout: vi.fn(),
      isAuthenticated: { value: false },
      roles: { value: [] },
    })),
  }
})

const mockFetch = vi.fn()
global.fetch = mockFetch

function mockJsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name === 'content-length' ? '100' : null) },
    json: async () => body,
  }
}

const mockConfig = {
  config_items: [],
  versions: [],
  enumerators: [],
  token: { claims: {} },
}

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.mocked(redirectToIdpLogin).mockClear()
    vi.mocked(useAuth).mockClear()
    localStorage.clear()
    // The app is mounted under the `/mentee/` Vite base; vitest resolves BASE_URL to `/`.
    vi.stubEnv('BASE_URL', '/mentee/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('Config', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    it('should fetch config successfully from the prefixed API base', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(mockConfig))

      const result = await api.getConfig()

      expect(result).toEqual(mockConfig)
      expect(mockFetch).toHaveBeenCalledWith(
        '/mentee/api/config',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })
  })

  describe('API base derivation', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    it('should collapse the base and endpoint into a single slash', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(mockConfig))

      await api.getConfig()

      expect(mockFetch).toHaveBeenCalledWith('/mentee/api/config', expect.any(Object))
    })

    it('should fall back to the un-prefixed base for direct-port debugging', async () => {
      vi.stubEnv('BASE_URL', '/')
      mockFetch.mockResolvedValueOnce(mockJsonResponse(mockConfig))

      await api.getConfig()

      expect(mockFetch).toHaveBeenCalledWith('/api/config', expect.any(Object))
    })
  })

  describe('Empty body handling', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    it('should return an empty object for a 204 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: { get: () => null },
        json: async () => {
          throw new Error('should not parse a 204 body')
        },
      })

      await expect(api.getConfig()).resolves.toEqual({})
    })

    it('should return an empty object when content-length is zero', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: (name: string) => (name === 'content-length' ? '0' : null) },
        json: async () => {
          throw new Error('should not parse an empty body')
        },
      })

      await expect(api.getConfig()).resolves.toEqual({})
    })
  })

  describe('401 Unauthorized Handling', () => {
    const mockLogout = vi.fn()

    beforeEach(() => {
      localStorage.setItem('access_token', 'invalid-token')
      localStorage.setItem('token_expires_at', '2026-12-31T23:59:59Z')
      localStorage.setItem('user_roles', JSON.stringify(['admin']))
      vi.mocked(useAuth).mockReturnValue({
        logout: mockLogout,
        isAuthenticated: { value: true },
        roles: { value: ['admin'] },
      })
    })

    it('should clear session and redirect on 401 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid token' })
      })

      try {
        await api.getConfig()
      } catch {
        // Error is expected to be thrown
      }

      expect(mockFetch).toHaveBeenCalledWith('/mentee/api/config', expect.any(Object))
      expect(mockLogout).toHaveBeenCalledOnce()
      expect(redirectToIdpLogin).toHaveBeenCalledOnce()
    })

    it('should map the error body onto ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid token' }),
      })

      await expect(api.getConfig()).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Invalid token',
        status: 401,
      })
    })
  })
})
