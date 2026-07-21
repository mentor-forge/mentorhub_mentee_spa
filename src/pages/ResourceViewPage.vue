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

    <v-row v-else-if="resourceDetail?.resource">
      <v-col cols="12">
        <MhCard
          :title="resourceCardTitle"
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

          <v-row>
            <v-col cols="12" md="6">
              <UrlEditor
                field="url"
                label="URL"
                :editable="false"
                automation-id="resource-view-url-display"
              />
              <SentenceEditor
                field="description"
                label="Description"
                :editable="false"
                automation-id="resource-view-description-display"
                class="mt-4"
              />
              <EnumEditor
                field="type"
                enums="resource_type"
                label="Type"
                :editable="false"
                automation-id="resource-view-type-display"
                class="mt-4"
              />
              <EnumEditor
                field="cost"
                enums="Costs"
                label="Cost"
                :editable="false"
                automation-id="resource-view-cost-display"
                class="mt-4"
              />
            </v-col>
            <v-col cols="12" md="6">
              <EnumEditor
                field="skill_level"
                enums="Skills"
                label="Skill Level"
                :editable="false"
                automation-id="resource-view-skill-level-display"
              />
              <EnumArrayEditor
                field="interests"
                enums="interests"
                label="Interests"
                :editable="false"
                automation-id="resource-view-interests-display"
                class="mt-4"
              />
              <EnumArrayEditor
                field="technologies"
                enums="technologies"
                label="Technologies"
                :editable="false"
                automation-id="resource-view-technologies-display"
                class="mt-4"
              />
              <DateTimeEditor
                field="last_verified"
                label="Last Verified"
                :editable="false"
                automation-id="resource-view-last-verified-display"
                class="mt-4"
              />
            </v-col>
          </v-row>

          <DataCard
            title="Aggregation"
            :model="aggregationModel"
            v-model:collapsed="aggregationCollapsed"
            automation-id="resource-view-aggregation-card"
            class="mt-6"
          >
            <div v-if="isAggregationLoading" class="text-center py-4">
              <v-progress-circular
                indeterminate
                color="primary"
                size="24"
                data-automation-id="resource-view-aggregation-loading"
              />
            </div>
            <template v-else-if="aggregationDetail?.aggregation">
              <v-row>
                <v-col cols="12" md="6">
                  <div data-automation-id="resource-view-aggregation-average-rating-display">
                    <div class="text-caption text-medium-emphasis mb-1">Average Rating</div>
                    <v-rating
                      :model-value="aggregationAverageRating ?? 0"
                      readonly
                      half-increments
                      length="4"
                      density="comfortable"
                      color="primary"
                    />
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <CountEditor
                    field="hits"
                    label="Hits"
                    :editable="false"
                    automation-id="resource-view-aggregation-hits-display"
                  />
                </v-col>
              </v-row>
              <v-row class="mt-4">
                <v-col cols="12" md="6">
                  <CountEditor
                    field="completions"
                    label="Completions"
                    :editable="false"
                    automation-id="resource-view-aggregation-completions-display"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <DurationEditor
                    field="duration"
                    label="Total Duration"
                    :editable="false"
                    automation-id="resource-view-aggregation-duration-display"
                  />
                </v-col>
              </v-row>
              <v-row class="mt-4">
                <v-col cols="12" md="6">
                  <CountEditor
                    field="note_count"
                    label="Note Count"
                    :editable="false"
                    automation-id="resource-view-aggregation-note-count-display"
                  />
                </v-col>
              </v-row>
            </template>
          </DataCard>

          <DataCard
            title="Notes"
            :model="notesPlaceholderModel"
            v-model:collapsed="notesCollapsed"
            automation-id="resource-view-notes-card"
            class="mt-4"
          >
            <div v-if="isAggregationLoading" class="text-center py-4">
              <v-progress-circular
                indeterminate
                color="primary"
                size="24"
                data-automation-id="resource-view-notes-loading"
              />
            </div>
            <div
              v-else-if="aggregationDetail && aggregationDetail.notes.length === 0"
              data-automation-id="resource-view-notes-empty"
            >
              No notes yet.
            </div>
            <div v-else-if="aggregationDetail?.notes?.length" data-automation-id="resource-view-notes-list">
              <div
                v-for="(note, index) in aggregationDetail.notes"
                :key="note._id"
                class="mb-4"
                :data-automation-id="`resource-view-note-${index}`"
              >
                <div
                  class="text-body-2"
                  :data-automation-id="`resource-view-note-${index}-text-display`"
                >
                  {{ note.note ?? '—' }}
                </div>
                <div
                  v-if="note.status"
                  class="text-caption text-medium-emphasis mt-1"
                  :data-automation-id="`resource-view-note-${index}-status-display`"
                >
                  {{ note.status }}
                </div>
              </div>
            </div>
          </DataCard>

          <DataCard
            v-if="hasAdminRole"
            title="Administration"
            :model="resourceModel"
            v-model:collapsed="adminCollapsed"
            automation-id="resource-view-admin-card"
            class="mt-4"
          >
            <EnumEditor
              field="status"
              enums="resource_status"
              label="Status"
              :editable="false"
              automation-id="resource-view-status-display"
            />
            <v-row class="mt-4">
              <v-col cols="12" md="6">
                <BreadcrumbDisplay field="created" label="Created" automation-id="resource-view-created" />
              </v-col>
              <v-col cols="12" md="6">
                <BreadcrumbDisplay field="saved" label="Last Saved" automation-id="resource-view-saved" />
              </v-col>
            </v-row>
          </DataCard>
        </MhCard>
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
  BreadcrumbDisplay,
  CountEditor,
  DataCard,
  DateTimeEditor,
  DurationEditor,
  EnumArrayEditor,
  EnumEditor,
  MhCard,
  provideDataCardContext,
  SentenceEditor,
  UrlEditor,
  useErrorHandler,
} from '@mentor-forge/mentorhub_spa_utils'
import { api } from '@/api/client'
import { useRoles } from '@/composables/useRoles'

const routeLocation = useRoute()
const router = useRouter()
const { hasRole } = useRoles()
const hasAdminRole = hasRole('admin')

const resourceId = computed(() => routeLocation.params.id as string)

const aggregationCollapsed = ref(true)
const notesCollapsed = ref(true)
const adminCollapsed = ref(true)

const shouldLoadAggregationDetail = computed(
  () => !aggregationCollapsed.value || !notesCollapsed.value
)

const { data: resourceDetail, isLoading, error: queryError } = useQuery({
  queryKey: ['resource', resourceId],
  queryFn: () => api.getResource(resourceId.value),
})

const {
  data: aggregationDetail,
  isLoading: isAggregationLoading,
  error: aggregationQueryError,
} = useQuery({
  queryKey: ['aggregation', resourceId],
  queryFn: () => api.getAggregationDetail(resourceId.value),
  enabled: shouldLoadAggregationDetail,
})

const resourceModel = computed(
  () => resourceDetail.value?.resource as unknown as Record<string, unknown>
)

provideDataCardContext({
  model: () => resourceModel.value,
  onSave: async () => {},
})

const resourceCardTitle = computed(
  () => resourceDetail.value?.resource?.name ?? 'Resource'
)

const aggregationAverageRating = computed(() => {
  const aggregation = aggregationDetail.value?.aggregation
  if (!aggregation?.rating_count || aggregation.rating_count <= 0) {
    return undefined
  }
  return Math.round((aggregation.rating_sum / aggregation.rating_count) * 10) / 10
})

const aggregationModel = computed(
  () => (aggregationDetail.value?.aggregation ?? {}) as unknown as Record<string, unknown>
)

const notesPlaceholderModel = computed(() => ({}))

const errorRef = ref<Error | null>(null)
watch(queryError, (err) => {
  errorRef.value = err
}, { immediate: true })
watch(aggregationQueryError, (err) => {
  if (err) {
    errorRef.value = err
  }
}, { immediate: true })

const { showError, errorMessage } = useErrorHandler(errorRef as any)
</script>
