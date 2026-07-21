<template>
  <MhCard
    :title="pathCardTitle"
    collapsible
    v-model:collapsed="cardCollapsed"
    :automation-id="`${automationIdPrefix}-card`"
  >
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <div v-if="!cardCollapsed && isLoading" class="text-center py-4">
      <v-progress-circular
        indeterminate
        color="primary"
        :data-automation-id="`${automationIdPrefix}-loading`"
      />
    </div>

    <template v-else-if="!cardCollapsed && path">
      <SentenceEditor
        field="description"
        label="Description"
        :editable="false"
        :automation-id="`${automationIdPrefix}-description-display`"
        class="text-body-1"
      />

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <EnumArrayEditor
            field="technologies"
            enums="technologies"
            label="Technologies"
            :editable="false"
            :automation-id="`${automationIdPrefix}-technologies-display`"
          />
        </v-col>
        <v-col cols="12" md="6">
          <EnumArrayEditor
            field="interests"
            enums="interests"
            label="Interests"
            :editable="false"
            :automation-id="`${automationIdPrefix}-interests-display`"
          />
        </v-col>
      </v-row>

      <DataCard
        v-if="(path.modules?.length ?? 0) > 0"
        title="Modules"
        :model="modulesPlaceholderModel"
        v-model:collapsed="modulesCollapsed"
        :automation-id="`${automationIdPrefix}-modules-card`"
        class="mt-6"
      >
        <MhCard
          v-for="(module, moduleIndex) in path.modules ?? []"
          :key="`module-${moduleIndex}`"
          :title="module.name ?? 'Module'"
          collapsible
          v-model:collapsed="moduleCollapsed[moduleIndex]"
          :automation-id="`${automationIdPrefix}-module-${moduleIndex}-card`"
          :class="moduleIndex > 0 ? 'mt-4' : undefined"
        >
          <template v-if="$slots['module-actions']" #actions>
            <slot
              name="module-actions"
              :module="module"
              :module-index="moduleIndex"
            />
          </template>

          <div
            v-if="module.description"
            class="text-body-1 mb-4"
            :data-automation-id="`${automationIdPrefix}-module-${moduleIndex}-description-display`"
          >
            {{ module.description }}
          </div>

          <MhCard
            v-for="(topic, topicIndex) in module.topics ?? []"
            :key="`topic-${moduleIndex}-${topicIndex}`"
            :title="topic.name ?? 'Topic'"
            collapsible
            v-model:collapsed="topicCollapsed[topicKey(moduleIndex, topicIndex)]"
            :automation-id="`${automationIdPrefix}-module-${moduleIndex}-topic-${topicIndex}-card`"
            :class="topicIndex > 0 ? 'mt-4' : undefined"
          >
            <div
              v-if="topic.description"
              class="text-body-1 mb-4"
              :data-automation-id="`${automationIdPrefix}-module-${moduleIndex}-topic-${topicIndex}-description-display`"
            >
              {{ topic.description }}
            </div>

            <ResourceViewCard
              v-for="(resource, resourceIndex) in topic.resources ?? []"
              :key="resource._id"
              :resource-id="resource._id"
              embed-mode
              :automation-id-prefix="`${automationIdPrefix}-module-${moduleIndex}-topic-${topicIndex}-resource-${resourceIndex}`"
              :class="resourceIndex > 0 ? 'mt-4' : undefined"
            />
          </MhCard>
        </MhCard>
      </DataCard>
    </template>
  </MhCard>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  DataCard,
  EnumArrayEditor,
  MhCard,
  provideDataCardContext,
  SentenceEditor,
} from '@mentor-forge/mentorhub_spa_utils'
import { api } from '@/api/client'
import ResourceViewCard from '@/components/ResourceViewCard.vue'

const props = withDefaults(
  defineProps<{
    pathId: string
    automationIdPrefix?: string
    defaultCollapsed?: boolean
  }>(),
  {
    automationIdPrefix: 'journey-path-embed',
    defaultCollapsed: true,
  }
)

const pathId = toRef(props, 'pathId')
const cardCollapsed = ref(props.defaultCollapsed)
const modulesCollapsed = ref(true)
const moduleCollapsed = ref<boolean[]>([])
const topicCollapsed = ref<Record<string, boolean>>({})

function topicKey(moduleIndex: number, topicIndex: number): string {
  return `${moduleIndex}-${topicIndex}`
}

const { data: path, isLoading } = useQuery({
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
const modulesPlaceholderModel = computed(() => ({}))

provideDataCardContext({
  model: () => pathModel.value,
  onSave: async () => {},
})

const pathCardTitle = computed(() => {
  if (path.value?.name) {
    return path.value.name
  }
  if (isLoading.value) {
    return 'Loading…'
  }
  return 'Path'
})
</script>
