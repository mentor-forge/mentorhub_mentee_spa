<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4" data-automation-id="path-list-heading">Paths</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <ListPageSearch
          :searchable="true"
          :search-query="searchQuery"
          :debounced-search="debouncedSearch"
          automation-id="path-list-search"
        />
      </v-col>
    </v-row>

    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-4"
      data-automation-id="path-list-loading"
    />

    <CardGrid automation-id="path-list-grid">
      <MhCard
        v-for="path in paths ?? []"
        :key="path._id"
        title="Path"
        :name="path.name"
        :automation-id="`path-list-path-${path._id}-card`"
      >
        <template #actions>
          <v-btn
            icon="mdi-eye"
            variant="text"
            size="small"
            :data-automation-id="`path-list-path-${path._id}-view-button`"
            :aria-label="`View ${path.name}`"
            @click="navigateToPath(path)"
          />
        </template>

        <p
          class="text-body-2 mb-3"
          :data-automation-id="`path-list-path-${path._id}-description-display`"
        >
          {{ path.description || 'No description provided.' }}
        </p>
        <v-chip
          size="small"
          variant="tonal"
          :data-automation-id="`path-list-path-${path._id}-status-display`"
        >
          {{ path.status || 'N/A' }}
        </v-chip>
      </MhCard>
    </CardGrid>

    <v-btn
      v-if="hasMoreValue"
      class="mt-4"
      :loading="isFetchingNextPageValue"
      color="primary"
      block
      data-automation-id="path-list-load-more"
      @click="loadMore"
    >
      {{ isFetchingNextPageValue ? 'Loading...' : 'Load More' }}
    </v-btn>

    <v-snackbar
      :model-value="showError as unknown as boolean"
      color="error"
      :timeout="5000"
      data-automation-id="path-list-error"
    >
      Failed to load paths: {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import { CardGrid, ListPageSearch, MhCard } from '@mentor-forge/mentorhub_spa_utils'
import { useOffsetList } from '@/composables/useOffsetList'
import { useRouter } from 'vue-router'
import type { Path } from '@/api/types'

const router = useRouter()

const {
  items: paths,
  isLoading,
  isFetchingNextPage,
  hasMore,
  loadMore,
  showError,
  errorMessage,
  searchQuery,
  debouncedSearch,
} = useOffsetList<Path>({
  queryKey: ['paths'],
  queryFn: (params) => api.getPaths(params),
  size: 20,
})

function navigateToPath(path: Path) {
  router.push(`/paths/${path._id}`)
}

const hasMoreValue = computed(() => hasMore.value)
const isFetchingNextPageValue = computed(() => isFetchingNextPage.value)

</script>