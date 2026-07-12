import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, hasStoredRole } from '@/composables/useAuth'
import { redirectToIdpLogin } from '@mentor-forge/mentorhub_spa_utils'

const router = createRouter({
  history: createWebHistory(),
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
      path: '/resources',
      name: 'Resources',
      component: () => import('@/pages/ResourcesListPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/resources/:id',
      name: 'ResourceView',
      component: () => import('@/pages/ResourceViewPage.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/paths',
      name: 'Paths',
      component: () => import('@/pages/PathsListPage.vue'),
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
    redirectToIdpLogin(window.location.origin + to.fullPath)
    return
  }

  const requiredRole = to.meta.requiresRole as string | undefined
  if (requiredRole && !hasStoredRole(requiredRole)) {
    next({ name: 'Journey' })
    return
  }

  next()
})

router.afterEach(() => {
  document.title = 'Mentee'
})

export default router
