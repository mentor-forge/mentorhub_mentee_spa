<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4" data-automation-id="path-view-heading">View Path</h1>
      </v-col>
    </v-row>

    <v-row v-if="isLoading">
      <v-col class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          data-automation-id="path-view-loading"
        />
      </v-col>
    </v-row>

    <v-row v-else-if="path">
      <v-col cols="12">
        <CardGrid automation-id="path-view-grid">
          <DataCard
            title="Path"
            name-field="name"
            :model="pathModel"
            automation-id="path-view-card"
          >
            <template #actions>
              <v-btn
                @click="router.push('/paths')"
                variant="text"
                data-automation-id="path-view-back-to-list-button"
              >
                Back to List
              </v-btn>
            </template>

            <WordEditor
              field="name"
              label="Name"
              :editable="false"
              automation-id="path-view-name-display"
            />
            <SentenceEditor
              field="description"
              label="Description"
              :editable="false"
              automation-id="path-view-description-display"
              class="mt-4"
            />
            <EnumEditor
              field="status"
              enums="default_status"
              label="Status"
              :editable="false"
              automation-id="path-view-status-display"
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
      data-automation-id="path-view-error"
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

const pathId = computed(() => routeLocation.params.id as string)

const { data: path, isLoading, error: queryError } = useQuery({
  queryKey: ['path', pathId],
  queryFn: () => api.getPath(pathId.value),
})

const pathModel = computed(() => path.value as unknown as Record<string, unknown>)

const errorRef = ref<Error | null>(null)
watch(queryError, (err) => {
  errorRef.value = err
}, { immediate: true })

const { showError, errorMessage } = useErrorHandler(errorRef as any)
</script>