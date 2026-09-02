import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const isAuthenticated = ref(true)
const hasStoredRole = vi.fn()
const redirectToIdpLogin = vi.fn()
const buildJourneyUrl = vi.fn(() => 'http://localhost:8080/discovery/')
const locationReplace = vi.fn()

vi.mock('@mentor-forge/mentorhub_spa_utils', () => ({
  hasStoredRole: (...args: unknown[]) => hasStoredRole(...args),
  redirectToIdpLogin: (...args: unknown[]) => redirectToIdpLogin(...args),
  buildJourneyUrl: (...args: unknown[]) => buildJourneyUrl(...args),
  useAuth: () => ({ isAuthenticated }),
}))

vi.mock('@/pages/AdminPage.vue', () => ({
  default: { name: 'AdminPageHost', template: '<div />' },
}))

vi.mock('@/pages/JourneyEditPage.vue', () => ({
  default: { name: 'JourneyEditPage', template: '<div />' },
}))

vi.mock('@/pages/ResourceViewPage.vue', () => ({
  default: { name: 'ResourceViewPage', template: '<div />' },
}))

vi.mock('@/pages/PathViewPage.vue', () => ({
  default: { name: 'PathViewPage', template: '<div />' },
}))

Object.defineProperty(window, 'location', {
  configurable: true,
  value: {
    origin: 'http://localhost:8394',
    replace: locationReplace,
  },
})

import router from './index'

describe('router /config role gate', () => {
  beforeEach(async () => {
    isAuthenticated.value = true
    hasStoredRole.mockReset()
    hasStoredRole.mockReturnValue(true)
    redirectToIdpLogin.mockReset()
    buildJourneyUrl.mockReset()
    buildJourneyUrl.mockReturnValue('http://localhost:8080/discovery/')
    locationReplace.mockReset()
    await router.replace('/')
  })

  it('resolves /config to the admin-gated AdminPage host', () => {
    const resolved = router.resolve('/config')
    expect(resolved.name).toBe('Admin')
    expect(resolved.meta.requiresAuth).toBe(true)
    expect(resolved.meta.requiresRole).toBe('admin')
  })

  it('keeps /admin as an alias of /config', () => {
    const resolved = router.resolve('/admin')
    expect(resolved.name).toBe('Admin')
    expect(resolved.meta.requiresRole).toBe('admin')
  })

  it('lets an admin stay on /config', async () => {
    hasStoredRole.mockReturnValue(true)
    await router.push('/config')
    expect(router.currentRoute.value.path).toBe('/config')
    expect(locationReplace).not.toHaveBeenCalled()
    expect(redirectToIdpLogin).not.toHaveBeenCalled()
  })

  it('sends an authenticated non-admin away from /config via Discovery fallback', async () => {
    hasStoredRole.mockReturnValue(false)
    await router.push('/config')
    expect(buildJourneyUrl).toHaveBeenCalledWith('discovery')
    expect(locationReplace).toHaveBeenCalledWith('http://localhost:8080/discovery/')
    expect(router.currentRoute.value.path).not.toBe('/config')
  })
})
