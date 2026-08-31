<template>
  <v-app>
    <PageFrame :page-title="appBarTitle">
      <router-view />
    </PageFrame>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, watch, type ComputedRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  PageFrame,
  provideEditorConfig,
  type RuntimeEditorConfig,
  useAuth,
} from '@mentor-forge/mentorhub_spa_utils'
import { api } from '@/api/client'
import { useAppTitle } from '@/composables/useAppTitle'
import { useConfig } from '@/composables/useConfig'

const { isAuthenticated } = useAuth()
const { config, loadConfig } = useConfig()
const { appBarTitle, setAppBarTitle, resetAppBarTitle } = useAppTitle()

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

onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      await loadConfig()
    } catch (error) {
      console.warn('Failed to load config on mount:', error)
    }
  }
})
</script>
