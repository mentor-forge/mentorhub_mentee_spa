import { createRouter, createWebHistory } from 'vue-router'
import {
  buildJourneyUrl,
  hasStoredRole,
  JOURNEY_APP_PATHS,
  redirectToIdpLogin,
  useAuth,
} from '@mentor-forge/mentorhub_spa_utils'

/** Absolute URL for a router path under the Vite base: `/paths/abc` → `http://host:8394/mentee/paths/abc`. */
function appUrl(fullPath: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return window.location.origin + prefix + fullPath.replace(/^\/+/, '')
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/journey'
    },

    {
      path: '/journey',
      name: 'Journey',
      component: () => import('@/pages/JourneyEditPage.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/resources/:id',
      name: 'ResourceView',
      component: () => import('@/pages/ResourceViewPage.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/paths/:id',
      name: 'PathView',
      component: () => import('@/pages/PathViewPage.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/pages/AdminPage.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    redirectToIdpLogin(appUrl(to.fullPath))
    next(false)
    return
  }

  const requiredRole = to.meta.requiresRole as string | undefined
  if (requiredRole && !hasStoredRole(requiredRole)) {
    const { journey, path } = JOURNEY_APP_PATHS.home
    window.location.replace(buildJourneyUrl(journey, path))
    next(false)
    return
  }

  next()
})

export default router
