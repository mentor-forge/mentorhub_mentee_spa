<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4" data-automation-id="resource-list-heading">Resources</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <ListPageSearch
          :searchable="true"
          :search-query="searchQuery"
          :debounced-search="debouncedSearch"
          automation-id="resource-list-search"
        />
      </v-col>
    </v-row>

    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-4"
      data-automation-id="resource-list-loading"
    />

    <CardGrid automation-id="resource-list-grid">
      <MhCard
        v-for="resource in resources ?? []"
        :key="resource._id"
        title="Resource"
        :name="resource.name"
        :automation-id="`resource-list-resource-${resource._id}-card`"
      >
        <template #actions>
          <v-btn
            icon="mdi-eye"
            variant="text"
            size="small"
            :data-automation-id="`resource-list-resource-${resource._id}-view-button`"
            :aria-label="`View ${resource.name}`"
            @click="navigateToResource(resource)"
          />
        </template>

        <p
          class="text-body-2 mb-3"
          :data-automation-id="`resource-list-resource-${resource._id}-description-display`"
        >
          {{ resource.description || 'No description provided.' }}
        </p>
        <v-chip
          size="small"
          variant="tonal"
          :data-automation-id="`resource-list-resource-${resource._id}-status-display`"
        >
          {{ resource.status || 'N/A' }}
        </v-chip>
      </MhCard>
    </CardGrid>

    <v-btn
      v-if="hasMoreValue"
      class="mt-4"
      :loading="isFetchingNextPageValue"
      color="primary"
      block
      data-automation-id="resource-list-load-more"
      @click="loadMore"
    >
      {{ isFetchingNextPageValue ? 'Loading...' : 'Load More' }}
    </v-btn>

    <v-snackbar
      :model-value="showError as unknown as boolean"
      color="error"
      :timeout="5000"
      data-automation-id="resource-list-error"
    >
      Failed to load resources: {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import { CardGrid, ListPageSearch, MhCard } from '@mentor-forge/mentorhub_spa_utils'
import { useOffsetList } from '@/composables/useOffsetList'
import { useRouter } from 'vue-router'
import type { Resource } from '@/api/types'

const router = useRouter()

const {
  items: resources,
  isLoading,
  isFetchingNextPage,
  hasMore,
  loadMore,
  showError,
  errorMessage,
  searchQuery,
  debouncedSearch,
} = useOffsetList<Resource>({
  queryKey: ['resources'],
  queryFn: (params) => api.getResources(params),
  size: 20,
})

function navigateToResource(resource: Resource) {
  router.push(`/resources/${resource._id}`)
}

const hasMoreValue = computed(() => hasMore.value)
const isFetchingNextPageValue = computed(() => isFetchingNextPage.value)

</script>