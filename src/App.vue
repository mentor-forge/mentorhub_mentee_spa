<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon
        v-if="isAuthenticated"
        @click="drawer = !drawer"
        data-automation-id="nav-drawer-toggle"
        aria-label="Open navigation drawer"
      />
      <v-app-bar-title>Mentee</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-if="isAuthenticated"
      v-model="drawer"
      temporary
    >
      <v-list density="compact" nav>
        
        <v-list-subheader>JOURNEY DOMAIN</v-list-subheader>
        <v-list-item
          to="/journeys"
          prepend-icon="mdi-view-list"
          title="List Journeys"
          data-automation-id="nav-journeys-list-link"
        />
        <v-list-item
          to="/journeys/new"
          prepend-icon="mdi-plus"
          title="New Journey"
          data-automation-id="nav-journeys-new-link"
        />

        <v-divider class="my-2" />
        
        <v-list-subheader>RATING DOMAIN</v-list-subheader>
        <v-list-item
          to="/ratings"
          prepend-icon="mdi-view-list"
          title="List Ratings"
          data-automation-id="nav-ratings-list-link"
        />
        <v-list-item
          to="/ratings/new"
          prepend-icon="mdi-plus"
          title="New Rating"
          data-automation-id="nav-ratings-new-link"
        />

        <v-divider class="my-2" />
        
        <v-list-subheader>NOTE DOMAIN</v-list-subheader>
        <v-list-item
          to="/notes"
          prepend-icon="mdi-view-list"
          title="List Notes"
          data-automation-id="nav-notes-list-link"
        />
        <v-list-item
          to="/notes/new"
          prepend-icon="mdi-plus"
          title="New Note"
          data-automation-id="nav-notes-new-link"
        />

        <v-divider class="my-2" />
        
        
        <v-list-subheader>EVENT DOMAIN</v-list-subheader>
        <v-list-item
          to="/events"
          prepend-icon="mdi-view-list"
          title="List Events"
          data-automation-id="nav-events-list-link"
        />
        <v-list-item
          to="/events/new"
          prepend-icon="mdi-plus"
          title="New Event"
          data-automation-id="nav-events-new-link"
        />

        <v-divider class="my-2" />
        
        
        <v-list-subheader>RESOURCE DOMAIN</v-list-subheader>
        <v-list-item
          to="/resources"
          prepend-icon="mdi-view-list"
          title="List Resources"
          data-automation-id="nav-resources-list-link"
        />
        
        <v-list-subheader>PATH DOMAIN</v-list-subheader>
        <v-list-item
          to="/paths"
          prepend-icon="mdi-view-list"
          title="List Paths"
          data-automation-id="nav-paths-list-link"
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
            @click="handleLogout"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useConfig } from '@/composables/useConfig'
import { useRoles } from '@/composables/useRoles'
import { redirectToIdpLogin } from '@mentor-forge/mentorhub_spa_utils'

const router = useRouter()
const { isAuthenticated, logout } = useAuth()
const { loadConfig } = useConfig()
const { hasRole } = useRoles()
const drawer = ref(false)

const hasAdminRole = hasRole('admin')

// Close temporary drawer when route changes (e.g. after clicking nav link)
router.afterEach(() => {
  drawer.value = false
})

onMounted(async () => {
  // Load config if user is already authenticated (e.g., on page reload)
  if (isAuthenticated.value) {
    try {
      await loadConfig()
    } catch (error) {
      // Silently fail - config will be loaded on next login if needed
      console.warn('Failed to load config on mount:', error)
    }
  }
})

function handleLogout() {
  logout()
  drawer.value = false
  redirectToIdpLogin(window.location.origin + '/')
}
</script>