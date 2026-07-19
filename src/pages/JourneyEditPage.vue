<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Journey</h1>
      </v-col>
    </v-row>

    <v-row v-if="isLoading">
      <v-col class="text-center">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <v-row v-else-if="journey">
      <v-col cols="12">
        <CardGrid automation-id="journey-edit-grid" cols="12" md="6" lg="4">
          <DataCard
            title="Journey"
            :model="journeyModel"
            :on-save="updateField"
            automation-id="journey-edit-card"
          >
            <EnumEditor
              field="status"
              enums="default_status"
              label="Status"
              automation-id="journey-edit-status-select"
            />
            <IdentifierEditor
              field="profile_id"
              label="Profile ID"
              automation-id="journey-profile-id-field"
              class="mt-4"
            />
          </DataCard>

          <MhCard title="Now" automation-id="journey-now-card">
            <div data-automation-id="journey-now-count">{{ journey.now?.length ?? 0 }} resource(s)</div>
          </MhCard>
          <MhCard title="Next" automation-id="journey-next-card">
            <div data-automation-id="journey-next-count">{{ journey.next?.length ?? 0 }} module(s)</div>
          </MhCard>
          <MhCard title="Library" automation-id="journey-library-card">
            <div data-automation-id="journey-library-count">
              {{ journey.library?.length ?? 0 }} completed resource(s)
            </div>
          </MhCard>

          <DataCard
            title="Audit"
            :model="journeyModel"
            :on-save="updateField"
            automation-id="journey-audit-card"
          >
            <BreadcrumbDisplay field="created" label="Created" automation-id="journey-created" />
            <BreadcrumbDisplay field="saved" label="Last Saved" automation-id="journey-saved" class="mt-4" />
          </DataCard>
        </CardGrid>
      </v-col>
    </v-row>

    <v-snackbar :model-value="showError as unknown as boolean" color="error" :timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import {
  BreadcrumbDisplay,
  CardGrid,
  DataCard,
  EnumEditor,
  IdentifierEditor,
  MhCard,
  useErrorHandler,
} from '@mentor-forge/mentorhub_spa_utils'
import type { JourneyUpdate } from '@/api/types'

const queryClient = useQueryClient()

const { data: journey, isLoading, error: queryError } = useQuery({
  queryKey: ['journey'],
  queryFn: () => api.getMyJourney(),
})

const errorRef = ref<Error | null>(null)
watch(queryError, (err) => {
  errorRef.value = err
}, { immediate: true })

const { showError, errorMessage } = useErrorHandler(errorRef as any)

const journeyModel = computed(() => journey.value as unknown as Record<string, unknown>)

const { mutateAsync: updateJourney } = useMutation({
  mutationFn: (data: JourneyUpdate) => {
    if (!journey.value?._id) {
      throw new Error('Journey not loaded')
    }
    return api.updateJourney(journey.value._id, data)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['journey'] })
    errorRef.value = null
  },
  onError: (error: Error) => {
    errorRef.value = error
  },
})

async function updateField(field: string, value: unknown) {
  if (field !== 'status' || typeof value !== 'string') {
    throw new Error(`Unsupported Journey field: ${field}`)
  }

  await updateJourney({ status: value as JourneyUpdate['status'] })
}
</script>
