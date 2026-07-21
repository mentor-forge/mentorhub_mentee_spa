<template>
  <v-container>
    <v-row v-if="isLoading">
      <v-col class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          data-automation-id="journey-edit-loading"
        />
      </v-col>
    </v-row>

    <v-row v-else-if="journey">
      <v-col cols="12">
        <MhCard title="Journey" automation-id="journey-detail-card">
          <JourneyProfileHeader v-if="journey.profile" :profile="journey.profile" />

          <DataCard
            title="Now"
            :model="nowPlaceholderModel"
            v-model:collapsed="nowCollapsed"
            automation-id="journey-detail-now-card"
            class="mt-6"
          >
            <div
              v-if="(journey.now?.length ?? 0) === 0"
              data-automation-id="journey-detail-now-empty"
            >
              No resources in Now.
            </div>
            <ResourceViewCard
              v-for="(item, index) in journey.now ?? []"
              :key="`${item.resource_id ?? index}-${index}`"
              :resource-id="resolveResourceId(item.resource_id)"
              embed-mode
              :automation-id-prefix="`journey-detail-now-resource-${index}`"
              :class="index > 0 ? 'mt-4' : undefined"
            >
              <template #actions>
                <v-btn
                  variant="text"
                  color="primary"
                  :data-automation-id="`journey-now-${index}-done-button`"
                  @click="openCompleteDialog(resolveResourceId(item.resource_id))"
                >
                  Done
                </v-btn>
              </template>
            </ResourceViewCard>
          </DataCard>

          <DataCard
            title="Next"
            :model="nextPlaceholderModel"
            v-model:collapsed="nextCollapsed"
            automation-id="journey-detail-next-card"
            class="mt-6"
          >
            <div
              v-if="(journey.next?.length ?? 0) === 0"
              data-automation-id="journey-detail-next-empty"
            >
              No modules in Next.
            </div>
            <MhCard
              v-for="(module, moduleIndex) in journey.next ?? []"
              :key="`next-module-${moduleIndex}`"
              :title="module.name ?? 'Module'"
              collapsible
              v-model:collapsed="nextModuleCollapsed[moduleIndex]"
              :automation-id="`journey-detail-next-module-${moduleIndex}-card`"
              :class="moduleIndex > 0 ? 'mt-4' : undefined"
            >
              <div
                v-if="module.description"
                class="text-body-1 mb-4"
                :data-automation-id="`journey-detail-next-module-${moduleIndex}-description-display`"
              >
                {{ module.description }}
              </div>

              <MhCard
                v-for="(topic, topicIndex) in module.topics ?? []"
                :key="`next-topic-${moduleIndex}-${topicIndex}`"
                :title="topic.name ?? 'Topic'"
                collapsible
                v-model:collapsed="nextTopicCollapsed[nextTopicKey(moduleIndex, topicIndex)]"
                :automation-id="`journey-detail-next-module-${moduleIndex}-topic-${topicIndex}-card`"
                :class="topicIndex > 0 ? 'mt-4' : undefined"
              >
                <div
                  v-if="topic.description"
                  class="text-body-1 mb-4"
                  :data-automation-id="`journey-detail-next-module-${moduleIndex}-topic-${topicIndex}-description-display`"
                >
                  {{ topic.description }}
                </div>

                <ResourceViewCard
                  v-for="(resourceId, resourceIndex) in topic.resources ?? []"
                  :key="`${resourceId}-${resourceIndex}`"
                  :resource-id="resourceId"
                  embed-mode
                  :automation-id-prefix="`journey-detail-next-module-${moduleIndex}-topic-${topicIndex}-resource-${resourceIndex}`"
                  :class="resourceIndex > 0 ? 'mt-4' : undefined"
                >
                  <template #actions>
                    <v-btn
                      variant="text"
                      color="primary"
                      :loading="advancingResourceId === resourceId"
                      :data-automation-id="`journey-detail-next-module-${moduleIndex}-topic-${topicIndex}-resource-${resourceIndex}-advance-button`"
                      @click="advanceResource(resourceId)"
                    >
                      Advance
                    </v-btn>
                  </template>
                </ResourceViewCard>
              </MhCard>
            </MhCard>
          </DataCard>

          <DataCard
            title="Later"
            :model="laterPlaceholderModel"
            v-model:collapsed="laterCollapsed"
            automation-id="journey-detail-later-card"
            class="mt-6"
          >
            <div
              v-if="(journey.later?.length ?? 0) === 0"
              data-automation-id="journey-detail-later-empty"
            >
              No paths in Later.
            </div>
            <JourneyPathEmbedCard
              v-for="(pathId, pathIndex) in journey.later ?? []"
              :key="pathId"
              :path-id="pathId"
              :automation-id-prefix="`journey-detail-later-path-${pathIndex}`"
              :class="pathIndex > 0 ? 'mt-4' : undefined"
            >
              <template #actions>
                <v-btn
                  variant="text"
                  color="primary"
                  :loading="promotingPathId === pathId"
                  :data-automation-id="`journey-later-${pathIndex}-promote-path-button`"
                  @click="promotePath(pathId)"
                >
                  Promote Path
                </v-btn>
              </template>
              <template #module-actions="{ module, moduleIndex }">
                <v-btn
                  v-if="module.name"
                  variant="text"
                  color="primary"
                  :disabled="isModuleInNext(module.name)"
                  :loading="promotingModuleKey === modulePromoteKey(pathId, module.name)"
                  :data-automation-id="`journey-later-${pathIndex}-module-${moduleIndex}-promote-button`"
                  @click="promoteModule(pathId, module.name!)"
                >
                  Promote Module
                </v-btn>
              </template>
            </JourneyPathEmbedCard>
          </DataCard>

          <DataCard
            title="Library"
            :model="libraryPlaceholderModel"
            v-model:collapsed="libraryCollapsed"
            automation-id="journey-detail-library-card"
            class="mt-6"
          >
            <div
              v-if="(journey.library?.length ?? 0) === 0"
              data-automation-id="journey-detail-library-empty"
            >
              No completed resources in Library.
            </div>
            <MhCard
              v-for="(item, index) in journey.library ?? []"
              :key="`${item.resource_id ?? index}-${index}`"
              :title="libraryItemTitle(item)"
              collapsible
              v-model:collapsed="libraryItemCollapsed[index]"
              :automation-id="`journey-detail-library-item-${index}-card`"
              :class="index > 0 ? 'mt-4' : undefined"
            >
              <div
                class="text-body-2 mb-4"
                :data-automation-id="`journey-detail-library-item-${index}-summary`"
              >
                <div v-if="item.completed">Completed: {{ item.completed }}</div>
                <div v-if="item.rating != null">Rating: {{ item.rating }} / 4</div>
                <div v-if="item.used != null">Used: {{ item.used }}</div>
              </div>
              <ResourceViewCard
                v-if="item.resource_id"
                :resource-id="resolveResourceId(item.resource_id)"
                embed-mode
                :automation-id-prefix="`journey-detail-library-item-${index}-resource`"
              />
            </MhCard>
          </DataCard>

          <DataCard
            title="Administration"
            :model="journeyModel"
            :on-save="updateField"
            v-model:collapsed="adminCollapsed"
            automation-id="journey-detail-admin-card"
            class="mt-6"
          >
            <EnumEditor
              field="status"
              enums="default_status"
              label="Status"
              automation-id="journey-edit-status-select"
            />
            <v-row class="mt-4">
              <v-col cols="12" md="6">
                <BreadcrumbDisplay field="created" label="Created" automation-id="journey-created" />
              </v-col>
              <v-col cols="12" md="6">
                <BreadcrumbDisplay field="saved" label="Last Saved" automation-id="journey-saved" class="mt-md-0 mt-4" />
              </v-col>
            </v-row>
          </DataCard>
        </MhCard>
      </v-col>
    </v-row>

    <JourneyCompleteDialog
      v-model="completeDialogOpen"
      :resource-id="completeResourceId"
      :loading="isCompleting"
      @confirm="submitComplete"
    />

    <v-snackbar
      :model-value="showError as unknown as boolean"
      color="error"
      :timeout="5000"
      data-automation-id="journey-edit-error"
    >
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
  DataCard,
  EnumEditor,
  MhCard,
  useErrorHandler,
} from '@mentor-forge/mentorhub_spa_utils'
import type { JourneyCompleteInput, JourneyLibraryItem, JourneyUpdate } from '@/api/types'
import JourneyCompleteDialog from '@/components/JourneyCompleteDialog.vue'
import JourneyPathEmbedCard from '@/components/JourneyPathEmbedCard.vue'
import JourneyProfileHeader from '@/components/JourneyProfileHeader.vue'
import ResourceViewCard from '@/components/ResourceViewCard.vue'

const queryClient = useQueryClient()

const laterCollapsed = ref(true)
const nextCollapsed = ref(true)
const nowCollapsed = ref(true)
const libraryCollapsed = ref(true)
const adminCollapsed = ref(true)
const nextModuleCollapsed = ref<boolean[]>([])
const nextTopicCollapsed = ref<Record<string, boolean>>({})
const libraryItemCollapsed = ref<boolean[]>([])

const promotingPathId = ref<string | null>(null)
const promotingModuleKey = ref<string | null>(null)
const advancingResourceId = ref<string | null>(null)
const completeDialogOpen = ref(false)
const completeResourceId = ref('')
const isCompleting = ref(false)

const laterPlaceholderModel = computed(() => ({}))
const nextPlaceholderModel = computed(() => ({}))
const nowPlaceholderModel = computed(() => ({}))
const libraryPlaceholderModel = computed(() => ({}))

function nextTopicKey(moduleIndex: number, topicIndex: number): string {
  return `${moduleIndex}-${topicIndex}`
}

function resolveResourceId(resourceId: string | undefined): string {
  return resourceId ?? ''
}

function libraryItemTitle(item: JourneyLibraryItem): string {
  return item.resource_id ? `Resource ${item.resource_id}` : 'Completed Resource'
}

function modulePromoteKey(pathId: string, moduleName: string): string {
  return `${pathId}:${moduleName}`
}

function isModuleInNext(moduleName: string): boolean {
  const names = new Set(
    (journey.value?.next ?? [])
      .map((module) => module.name)
      .filter((name): name is string => Boolean(name))
  )
  return names.has(moduleName)
}

function invalidateJourney() {
  queryClient.invalidateQueries({ queryKey: ['journey'] })
  errorRef.value = null
}

function handleMutationError(error: Error) {
  errorRef.value = error
}

async function promotePath(pathId: string) {
  promotingPathId.value = pathId
  try {
    await api.promoteJourneyPath(pathId)
    invalidateJourney()
  } catch (error) {
    handleMutationError(error as Error)
  } finally {
    promotingPathId.value = null
  }
}

async function promoteModule(pathId: string, moduleName: string) {
  const key = modulePromoteKey(pathId, moduleName)
  promotingModuleKey.value = key
  try {
    await api.promoteJourneyModule(pathId, moduleName)
    invalidateJourney()
  } catch (error) {
    handleMutationError(error as Error)
  } finally {
    promotingModuleKey.value = null
  }
}

async function advanceResource(resourceId: string) {
  advancingResourceId.value = resourceId
  try {
    await api.advanceJourneyResource(resourceId)
    invalidateJourney()
  } catch (error) {
    handleMutationError(error as Error)
  } finally {
    advancingResourceId.value = null
  }
}

function openCompleteDialog(resourceId: string) {
  completeResourceId.value = resourceId
  completeDialogOpen.value = true
}

async function submitComplete(input: JourneyCompleteInput) {
  if (!completeResourceId.value) {
    return
  }

  isCompleting.value = true
  try {
    await api.completeJourneyResource(completeResourceId.value, input)
    completeDialogOpen.value = false
    invalidateJourney()
  } catch (error) {
    handleMutationError(error as Error)
  } finally {
    isCompleting.value = false
  }
}

const { data: journey, isLoading, error: queryError } = useQuery({
  queryKey: ['journey'],
  queryFn: () => api.getMyJourney(),
})

watch(
  journey,
  (journeyDoc) => {
    nextModuleCollapsed.value = (journeyDoc?.next ?? []).map(() => true)
    const topics: Record<string, boolean> = {}
    journeyDoc?.next?.forEach((module, moduleIndex) => {
      module.topics?.forEach((_, topicIndex) => {
        topics[nextTopicKey(moduleIndex, topicIndex)] = true
      })
    })
    nextTopicCollapsed.value = topics
    libraryItemCollapsed.value = (journeyDoc?.library ?? []).map(() => true)
  },
  { immediate: true }
)

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
