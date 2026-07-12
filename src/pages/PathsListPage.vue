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

    <v-row>
      <v-col>
        <v-card>
          <v-data-table
            :headers="headers"
            :items="(paths ?? []) as unknown as Path[]"
            :loading="isLoading as unknown as boolean"
            @click:row="navigateToPath"
            hover
            :items-per-page="-1"
            hide-default-footer
          >
            <template v-slot:header.name>
              <span style="cursor: pointer; user-select: none;" @click="handleSort('name')">
                Name
                <v-icon v-if="sortByValue === 'name'" size="small">
                  {{ orderValue === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
              </span>
            </template>
            <template v-slot:header.status>
              <span style="cursor: pointer; user-select: none;" @click="handleSort('status')">
                Status
                <v-icon v-if="sortByValue === 'status'" size="small">
                  {{ orderValue === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
              </span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip size="small">
                {{ (item as Path)?.status || 'N/A' }}
              </v-chip>
            </template>
          </v-data-table>
          
          <!-- Load more button -->
          <v-card-actions v-if="hasMoreValue">
            <v-btn
              @click="loadMore"
              :loading="isFetchingNextPageValue"
              color="primary"
              block
              data-automation-id="path-list-load-more"
            >
              {{ isFetchingNextPageValue ? 'Loading...' : 'Load More' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar :model-value="showError as unknown as boolean" color="error" :timeout="5000">
      Failed to load paths: {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
/**
 * Paths List Page - Showcase of mentorhub_spa_utils simplicity
 * 
 * Building a list page with infinite scroll, search, and sorting
 * is as simple as calling useInfiniteScroll with your API function.
 */
import { computed } from 'vue'
import { api } from '@/api/client'
import { ListPageSearch, useInfiniteScroll } from '@mentor-forge/mentorhub_spa_utils'
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
  sortBy,
  order,
  setSortBy,
  setOrder,
} = useInfiniteScroll<Path>({
  queryKey: ['paths'],
  queryFn: (params) => api.getPaths(params),
  getItemId: (item) => item._id,
  limit: 20,
})

function navigateToPath(_event: unknown, { item }: { item: Path }) {
  router.push(`/paths/${item._id}`)
}

// Create computed properties for template use (TypeScript-friendly)
const sortByValue = computed(() => sortBy.value)
const orderValue = computed(() => order.value)
const hasMoreValue = computed(() => hasMore.value)
const isFetchingNextPageValue = computed(() => isFetchingNextPage.value)

function handleSort(field: string) {
  if (sortBy.value === field) {
    // Toggle order if same field
    setOrder(order.value === 'asc' ? 'desc' : 'asc')
  } else {
    // New field, default to ascending
    setSortBy(field)
    setOrder('asc')
  }
}

const headers = [
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
]

</script>