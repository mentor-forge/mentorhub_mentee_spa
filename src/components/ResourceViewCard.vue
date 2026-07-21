<template>
  <div v-if="isLoading" class="text-center py-4">
    <v-progress-circular
      indeterminate
      color="primary"
      :data-automation-id="`${automationIdPrefix}-loading`"
    />
  </div>

  <MhCard
    v-else-if="resourceDetail?.resource"
    :title="resourceCardTitle"
    :collapsible="embedMode"
    v-model:collapsed="cardCollapsed"
    :automation-id="`${automationIdPrefix}-card`"
  >
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <v-row>
      <v-col cols="12" md="6">
        <MarkdownEditor
          field="description"
          label="Description"
          :editable="false"
          :automation-id="`${automationIdPrefix}-description-display`"
        />
        <UrlEditor
          field="url"
          label="URL"
          :editable="false"
          :automation-id="`${automationIdPrefix}-url-display`"
          class="mt-4"
        />
        <EnumEditor
          field="type"
          enums="resource_type"
          label="Type"
          :editable="false"
          :automation-id="`${automationIdPrefix}-type-display`"
          class="mt-4"
        />
        <EnumEditor
          field="cost"
          enums="Costs"
          label="Cost"
          :editable="false"
          :automation-id="`${automationIdPrefix}-cost-display`"
          class="mt-4"
        />
      </v-col>
      <v-col cols="12" md="6">
        <EnumEditor
          field="skill_level"
          enums="Skills"
          label="Skill Level"
          :editable="false"
          :automation-id="`${automationIdPrefix}-skill-level-display`"
        />
        <EnumArrayEditor
          field="interests"
          enums="interests"
          label="Interests"
          :editable="false"
          :automation-id="`${automationIdPrefix}-interests-display`"
          class="mt-4"
        />
        <EnumArrayEditor
          field="technologies"
          enums="technologies"
          label="Technologies"
          :editable="false"
          :automation-id="`${automationIdPrefix}-technologies-display`"
          class="mt-4"
        />
        <DateTimeEditor
          field="last_verified"
          label="Last Verified"
          :editable="false"
          :automation-id="`${automationIdPrefix}-last-verified-display`"
          class="mt-4"
        />
      </v-col>
    </v-row>

    <DataCard
      title="Aggregation"
      :model="aggregationModel"
      v-model:collapsed="aggregationCollapsed"
      :automation-id="`${automationIdPrefix}-aggregation-card`"
      class="mt-6"
    >
      <div v-if="isAggregationLoading" class="text-center py-4">
        <v-progress-circular
          indeterminate
          color="primary"
          size="24"
          :data-automation-id="`${automationIdPrefix}-aggregation-loading`"
        />
      </div>
      <template v-else-if="aggregationDetail?.aggregation">
        <v-row>
          <v-col cols="12" md="6">
            <div :data-automation-id="`${automationIdPrefix}-aggregation-average-rating-display`">
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
              :automation-id="`${automationIdPrefix}-aggregation-hits-display`"
            />
          </v-col>
        </v-row>
        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <CountEditor
              field="completions"
              label="Completions"
              :editable="false"
              :automation-id="`${automationIdPrefix}-aggregation-completions-display`"
            />
          </v-col>
          <v-col cols="12" md="6">
            <DurationEditor
              field="duration"
              label="Total Duration"
              :editable="false"
              :automation-id="`${automationIdPrefix}-aggregation-duration-display`"
            />
          </v-col>
        </v-row>
        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <CountEditor
              field="note_count"
              label="Note Count"
              :editable="false"
              :automation-id="`${automationIdPrefix}-aggregation-note-count-display`"
            />
          </v-col>
        </v-row>
      </template>
    </DataCard>

    <DataCard
      title="Notes"
      :model="notesPlaceholderModel"
      v-model:collapsed="notesCollapsed"
      :automation-id="`${automationIdPrefix}-notes-card`"
      class="mt-4"
    >
      <div v-if="isAggregationLoading" class="text-center py-4">
        <v-progress-circular
          indeterminate
          color="primary"
          size="24"
          :data-automation-id="`${automationIdPrefix}-notes-loading`"
        />
      </div>
      <div
        v-else-if="aggregationDetail && aggregationDetail.notes.length === 0"
        :data-automation-id="`${automationIdPrefix}-notes-empty`"
      >
        No notes yet.
      </div>
      <div v-else-if="aggregationDetail?.notes?.length" :data-automation-id="`${automationIdPrefix}-notes-list`">
        <div
          v-for="(note, index) in aggregationDetail.notes"
          :key="note._id"
          class="mb-4"
          :data-automation-id="`${automationIdPrefix}-note-${index}`"
        >
          <div
            class="text-body-2"
            :data-automation-id="`${automationIdPrefix}-note-${index}-text-display`"
          >
            {{ note.note ?? '—' }}
          </div>
        </div>
      </div>
    </DataCard>

    <DataCard
      v-if="!embedMode && hasAdminRole"
      title="Administration"
      :model="resourceModel"
      v-model:collapsed="adminCollapsed"
      :automation-id="`${automationIdPrefix}-admin-card`"
      class="mt-4"
    >
      <EnumEditor
        field="status"
        enums="resource_status"
        label="Status"
        :editable="false"
        :automation-id="`${automationIdPrefix}-status-display`"
      />
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <BreadcrumbDisplay field="created" label="Created" :automation-id="`${automationIdPrefix}-created`" />
        </v-col>
        <v-col cols="12" md="6">
          <BreadcrumbDisplay field="saved" label="Last Saved" :automation-id="`${automationIdPrefix}-saved`" />
        </v-col>
      </v-row>
    </DataCard>
  </MhCard>

  <v-snackbar
    v-if="!embedMode"
    :model-value="showError as unknown as boolean"
    color="error"
    :timeout="5000"
    :data-automation-id="`${automationIdPrefix}-error`"
  >
    {{ errorMessage }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  BreadcrumbDisplay,
  CountEditor,
  DataCard,
  DateTimeEditor,
  DurationEditor,
  EnumArrayEditor,
  EnumEditor,
  MarkdownEditor,
  MhCard,
  provideDataCardContext,
  UrlEditor,
  useErrorHandler,
} from '@mentor-forge/mentorhub_spa_utils'
import { api } from '@/api/client'
import { useRoles } from '@/composables/useRoles'

const props = withDefaults(
  defineProps<{
    resourceId: string
    embedMode?: boolean
    automationIdPrefix?: string
  }>(),
  {
    embedMode: false,
    automationIdPrefix: 'resource-view',
  }
)

const { hasRole } = useRoles()
const hasAdminRole = hasRole('admin')

const resourceId = toRef(props, 'resourceId')
const cardCollapsed = ref(props.embedMode)
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
