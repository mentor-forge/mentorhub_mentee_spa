<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Paths</h1>
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

    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />

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

        <p class="text-body-2 mb-3">{{ path.description || 'No description provided.' }}</p>
        <v-chip size="small" variant="tonal">{{ path.status || 'N/A' }}</v-chip>
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

    <v-snackbar :model-value="showError as unknown as boolean" color="error" :timeout="5000">
      Failed to load paths: {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
/**
 * Paths List Page - Showcase of mentorhub_spa_utils simplicity
 * 
 * This page retains the legacy infinite-scroll data source while presenting
 * paths as responsive shared cards.
 */
import { computed } from 'vue'
import { api } from '@/api/client'
import { CardGrid, ListPageSearch, MhCard, useInfiniteScroll } from '@mentor-forge/mentorhub_spa_utils'
import { useRouter } from 'vue-router'
import type { Path } from '@/api/types'

const router = useRouter()

// 🎯 All list functionality in one composable call
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
} = useInfiniteScroll<Path>({
  queryKey: ['paths'],
  queryFn: (params) => api.getPaths(params),
  getItemId: (item) => item._id,
  limit: 20,
})

function navigateToPath(path: Path) {
  router.push(`/paths/${path._id}`)
}

const hasMoreValue = computed(() => hasMore.value)
const isFetchingNextPageValue = computed(() => isFetchingNextPage.value)

</script>