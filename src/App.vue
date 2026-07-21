<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon
        v-if="isAuthenticated"
        @click="drawer = !drawer"
        data-automation-id="nav-drawer-toggle"
        aria-label="Open navigation drawer"
      />
      <v-app-bar-title data-automation-id="app-bar-title">{{ appBarTitle }}</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-if="isAuthenticated"
      v-model="drawer"
      temporary
    >
      <v-list density="compact" nav>
        <v-list-item
          to="/journey"
          prepend-icon="mdi-map-marker-path"
          title="Journey"
          data-automation-id="nav-journey-link"
        />
        <v-list-item
          to="/paths"
          prepend-icon="mdi-routes"
          title="Paths"
          data-automation-id="nav-paths-link"
        />
        <v-list-item
          to="/resources"
          prepend-icon="mdi-book-open-variant"
          title="Resources"
          data-automation-id="nav-resources-link"
        />
      </v-list>

      <template v-slot:append>
        <v-divider />
        <v-list density="compact" nav>
          <v-list-item
            v-if="hasAdminRole"
            to="/admin"
            prepend-icon="mdi-cog"
            title="Admin"
            data-automation-id="nav-admin-link"
          />
          <v-list-item
            @click.stop="handleLogout"
            prepend-icon="mdi-logout"
            title="Logout"
            data-automation-id="nav-logout-link"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import {
  provideEditorConfig,
  redirectToIdpLogin,
  type RuntimeEditorConfig,
  useAuth,
} from '@mentor-forge/mentorhub_spa_utils'
import { api } from '@/api/client'
import { useAppTitle } from '@/composables/useAppTitle'
import { useConfig } from '@/composables/useConfig'
import { useRoles } from '@/composables/useRoles'

const router = useRouter()
const { isAuthenticated, logout } = useAuth()
const { config, loadConfig } = useConfig()
const { hasRole } = useRoles()
const { appBarTitle, setAppBarTitle, resetAppBarTitle } = useAppTitle()
const drawer = ref(false)

const { data: journey } = useQuery({
  queryKey: ['journey'],
  queryFn: () => api.getMyJourney(),
  enabled: isAuthenticated,
})

watch(
  journey,
  (journeyDoc) => {
    setAppBarTitle(journeyDoc?.profile?.full_name)
  },
  { immediate: true }
)

watch(isAuthenticated, (authenticated) => {
  if (!authenticated) {
    resetAppBarTitle()
  }
})

provideEditorConfig(config as unknown as ComputedRef<RuntimeEditorConfig | null>)

const hasAdminRole = hasRole('admin')

router.afterEach(() => {
  drawer.value = false
})

onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      await loadConfig()
    } catch (error) {
      console.warn('Failed to load config on mount:', error)
    }
  }
})

function handleLogout() {
  const returnTo = `${window.location.origin}/`
  resetAppBarTitle()
  logout()
  drawer.value = false
  redirectToIdpLogin(returnTo)
}
</script>
