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
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <AutoSaveSelect
              :model-value="journey.status || 'active'"
              label="Status"
              :items="statusOptions"
              :on-save="(value: string) => updateField('status', value)"
              automation-id="journey-edit-status-select"
            />

            <v-text-field
              :model-value="journey.profile_id || ''"
              label="Profile ID"
              readonly
              variant="outlined"
              density="compact"
              class="mt-4"
              data-automation-id="journey-profile-id-field"
            />

            <v-divider class="my-6" />

            <v-row>
              <v-col cols="12" sm="4">
                <v-card variant="outlined">
                  <v-card-title class="text-subtitle-1">Now</v-card-title>
                  <v-card-text data-automation-id="journey-now-count">
                    {{ journey.now?.length ?? 0 }} resource(s)
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="outlined">
                  <v-card-title class="text-subtitle-1">Next</v-card-title>
                  <v-card-text data-automation-id="journey-next-count">
                    {{ journey.next?.length ?? 0 }} module(s)
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="outlined">
                  <v-card-title class="text-subtitle-1">Library</v-card-title>
                  <v-card-text data-automation-id="journey-library-count">
                    {{ journey.library?.length ?? 0 }} completed resource(s)
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="my-6" />

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  :model-value="formatDate(journey.created.at_time)"
                  label="Created"
                  readonly
                  variant="outlined"
                  density="compact"
                />
                <v-text-field
                  :model-value="journey.created.by_user"
                  label="Created By"
                  readonly
                  variant="outlined"
                  density="compact"
                  class="mt-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  :model-value="formatDate(journey.saved.at_time)"
                  label="Last Saved"
                  readonly
                  variant="outlined"
                  density="compact"
                />
                <v-text-field
                  :model-value="journey.saved.by_user"
                  label="Last Saved By"
                  readonly
                  variant="outlined"
                  density="compact"
                  class="mt-2"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar :model-value="showError as unknown as boolean" color="error" :timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { AutoSaveSelect, formatDate, useErrorHandler } from '@mentor-forge/mentorhub_spa_utils'
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

const statusOptions = ['active', 'archived']

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

async function updateField(field: keyof JourneyUpdate, value: string) {
  await updateJourney({ [field]: value })
}
</script>
