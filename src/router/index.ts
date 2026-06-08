import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, hasStoredRole } from '@/composables/useAuth'
import { redirectToIdpLogin } from '@mentor-forge/mentorhub_spa_utils'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/journeys'
    },
    
    // Control domain: Journey
    {
      path: '/journeys',
      name: 'Journeys',
      component: () => import('@/pages/JourneysListPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/journeys/new',
      name: 'JourneyNew',
      component: () => import('@/pages/JourneyNewPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/journeys/:id',
      name: 'JourneyEdit',
      component: () => import('@/pages/JourneyEditPage.vue'),
      meta: { requiresAuth: true }
    },
    
    // Control domain: Rating
    {
      path: '/ratings',
      name: 'Ratings',
      component: () => import('@/pages/RatingsListPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ratings/new',
      name: 'RatingNew',
      component: () => import('@/pages/RatingNewPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ratings/:id',
      name: 'RatingEdit',
      component: () => import('@/pages/RatingEditPage.vue'),
      meta: { requiresAuth: true }
    },
    
    // Control domain: Note
    {
      path: '/notes',
      name: 'Notes',
      component: () => import('@/pages/NotesListPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notes/new',
      name: 'NoteNew',
      component: () => import('@/pages/NoteNewPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notes/:id',
      name: 'NoteEdit',
      component: () => import('@/pages/NoteEditPage.vue'),
      meta: { requiresAuth: true }
    },
    
    
    // Create domain: Event
    {
      path: '/events',
      name: 'Events',
      component: () => import('@/pages/EventsListPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/events/new',
      name: 'EventNew',
      component: () => import('@/pages/EventNewPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/events/:id',
      name: 'EventView',
      component: () => import('@/pages/EventViewPage.vue'),
      meta: { requiresAuth: true }
    },
    
    
    // Consume domain: Resource
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
    
    // Consume domain: Path
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
    
    // Admin route
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
  
  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    redirectToIdpLogin(window.location.origin + to.fullPath)
    return
  }
  
  // Check role-based authorization
  const requiredRole = to.meta.requiresRole as string | undefined
  if (requiredRole && !hasStoredRole(requiredRole)) {
    // Redirect to default page if user doesn't have required role
    next({ name: 'Journeys' })
    return
  }
  
  next()
})

router.afterEach(() => {
  document.title = 'Mentee'
})

export default router