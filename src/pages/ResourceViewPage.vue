<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4" data-automation-id="resource-view-heading">View Resource</h1>
      </v-col>
    </v-row>

    <v-row v-if="isLoading">
      <v-col class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          data-automation-id="resource-view-loading"
        />
      </v-col>
    </v-row>

    <v-row v-else-if="resource">
      <v-col cols="12">
        <CardGrid automation-id="resource-view-grid" cols="12" md="8">
          <DataCard
            title="Resource"
            name-field="name"
            :model="resourceModel"
            automation-id="resource-view-card"
          >
            <template #actions>
              <v-btn
                @click="router.push('/resources')"
                variant="text"
                data-automation-id="resource-view-back-to-list-button"
              >
                Back to List
              </v-btn>
            </template>

            <WordEditor
              field="name"
              label="Name"
              :editable="false"
              automation-id="resource-view-name-display"
            />
            <SentenceEditor
              field="description"
              label="Description"
              :editable="false"
              automation-id="resource-view-description-display"
              class="mt-4"
            />
            <EnumEditor
              field="status"
              enums="default_status"
              label="Status"
              :editable="false"
              automation-id="resource-view-status-display"
              class="mt-4"
            />
          </DataCard>
        </CardGrid>
      </v-col>
    </v-row>

    <v-snackbar
      :model-value="showError as unknown as boolean"
      color="error"
      :timeout="5000"
      data-automation-id="resource-view-error"
    >
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import {
  CardGrid,
  DataCard,
  EnumEditor,
  SentenceEditor,
  WordEditor,
  useErrorHandler,
} from '@mentor-forge/mentorhub_spa_utils'
import { api } from '@/api/client'

const routeLocation = useRoute()
const router = useRouter()

const resourceId = computed(() => routeLocation.params.id as string)

const { data: resource, isLoading, error: queryError } = useQuery({
  queryKey: ['resource', resourceId],
  queryFn: () => api.getResource(resourceId.value),
})

const resourceModel = computed(() => resource.value as unknown as Record<string, unknown>)

const errorRef = ref<Error | null>(null)
watch(queryError, (err) => {
  errorRef.value = err
}, { immediate: true })

const { showError, errorMessage } = useErrorHandler(errorRef as any)
</script>