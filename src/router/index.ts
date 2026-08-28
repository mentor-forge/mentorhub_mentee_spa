import { createRouter, createWebHistory } from 'vue-router'
import {
  buildJourneyUrl,
  hasStoredRole,
  redirectToIdpLogin,
  useAuth,
} from '@mentor-forge/mentorhub_spa_utils'

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
    const basePath = import.meta.env.BASE_URL || '/'
    const returnPath = to.fullPath.startsWith('/') ? to.fullPath.slice(1) : to.fullPath
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`
    const returnUrl = `${window.location.origin}${normalizedBase}${returnPath}`
    redirectToIdpLogin(returnUrl)
    next(false)
    return
  }

  const requiredRole = to.meta.requiresRole as string | undefined
  if (requiredRole && !hasStoredRole(requiredRole)) {
    window.location.replace(buildJourneyUrl('discovery'))
    next(false)
    return
  }

  next()
})

export default router
