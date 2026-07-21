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
        <MhCard
          :title="pathCardTitle"
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

          <SentenceEditor
            field="description"
            label="Description"
            :editable="false"
            automation-id="path-view-description-display"
            class="text-body-1"
          />

          <v-row class="mt-4">
            <v-col cols="12" md="6">
              <EnumArrayEditor
                field="technologies"
                enums="technologies"
                label="Technologies"
                :editable="false"
                automation-id="path-view-technologies-display"
              />
            </v-col>
            <v-col cols="12" md="6">
              <EnumArrayEditor
                field="interests"
                enums="interests"
                label="Interests"
                :editable="false"
                automation-id="path-view-interests-display"
              />
            </v-col>
          </v-row>

          <MhCard
            v-for="(module, moduleIndex) in path.modules ?? []"
            :key="`module-${moduleIndex}`"
            :title="module.name ?? 'Module'"
            collapsible
            v-model:collapsed="moduleCollapsed[moduleIndex]"
            :automation-id="`path-view-module-${moduleIndex}-card`"
            class="mt-6"
          >
            <div
              v-if="module.description"
              class="text-body-1 mb-4"
              :data-automation-id="`path-view-module-${moduleIndex}-description-display`"
            >
              {{ module.description }}
            </div>

            <MhCard
              v-for="(topic, topicIndex) in module.topics ?? []"
              :key="`topic-${moduleIndex}-${topicIndex}`"
              :title="topic.name ?? 'Topic'"
              collapsible
              v-model:collapsed="topicCollapsed[topicKey(moduleIndex, topicIndex)]"
              :automation-id="`path-view-module-${moduleIndex}-topic-${topicIndex}-card`"
              :class="topicIndex > 0 ? 'mt-4' : undefined"
            >
              <div
                v-if="topic.description"
                class="text-body-1 mb-4"
                :data-automation-id="`path-view-module-${moduleIndex}-topic-${topicIndex}-description-display`"
              >
                {{ topic.description }}
              </div>

              <ResourceViewCard
                v-for="(resource, resourceIndex) in topic.resources ?? []"
                :key="resource._id"
                :resource-id="resource._id"
                embed-mode
                :automation-id-prefix="`path-view-module-${moduleIndex}-topic-${topicIndex}-resource-${resourceIndex}`"
                :class="resourceIndex > 0 ? 'mt-4' : undefined"
              />
            </MhCard>
          </MhCard>

          <DataCard
            v-if="hasAdminRole"
            title="Administration"
            :model="pathModel"
            v-model:collapsed="adminCollapsed"
            automation-id="path-view-admin-card"
            class="mt-6"
          >
            <EnumEditor
              field="status"
              enums="default_status"
              label="Status"
              :editable="false"
              automation-id="path-view-status-display"
            />
            <v-row class="mt-4">
              <v-col cols="12" md="6">
                <BreadcrumbDisplay field="created" label="Created" automation-id="path-view-created" />
              </v-col>
              <v-col cols="12" md="6">
                <BreadcrumbDisplay field="saved" label="Last Saved" automation-id="path-view-saved" />
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
  BreadcrumbDisplay,
  DataCard,
  EnumArrayEditor,
  EnumEditor,
  MhCard,
  provideDataCardContext,
  SentenceEditor,
  useErrorHandler,
} from '@mentor-forge/mentorhub_spa_utils'
import { api } from '@/api/client'
import { useRoles } from '@/composables/useRoles'
import ResourceViewCard from '@/components/ResourceViewCard.vue'

const routeLocation = useRoute()
const router = useRouter()
const { hasRole } = useRoles()
const hasAdminRole = hasRole('admin')

const pathId = computed(() => routeLocation.params.id as string)

const adminCollapsed = ref(true)
const moduleCollapsed = ref<boolean[]>([])
const topicCollapsed = ref<Record<string, boolean>>({})

function topicKey(moduleIndex: number, topicIndex: number): string {
  return `${moduleIndex}-${topicIndex}`
}

const { data: path, isLoading, error: queryError } = useQuery({
  queryKey: ['path', pathId],
  queryFn: () => api.getPath(pathId.value),
})

watch(
  path,
  (pathDetail) => {
    moduleCollapsed.value = (pathDetail?.modules ?? []).map(() => true)
    const nextTopicCollapsed: Record<string, boolean> = {}
    pathDetail?.modules?.forEach((module, moduleIndex) => {
      module.topics?.forEach((_, topicIndex) => {
        nextTopicCollapsed[topicKey(moduleIndex, topicIndex)] = true
      })
    })
    topicCollapsed.value = nextTopicCollapsed
  },
  { immediate: true }
)

const pathModel = computed(() => path.value as unknown as Record<string, unknown>)

provideDataCardContext({
  model: () => pathModel.value,
  onSave: async () => {},
})

const pathCardTitle = computed(() => path.value?.name ?? 'Path')

const errorRef = ref<Error | null>(null)
watch(queryError, (err) => {
  errorRef.value = err
}, { immediate: true })

const { showError, errorMessage } = useErrorHandler(errorRef as any)
</script>
