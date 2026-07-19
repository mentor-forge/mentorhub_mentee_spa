import { computed, ref, watch } from 'vue'
import { useInfiniteQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { useErrorHandler } from '@mentor-forge/mentorhub_spa_utils'
import type { ListParams } from '@/api/types'

interface UseOffsetListOptions<T> {
  queryKey: readonly unknown[]
  queryFn: (params: ListParams) => Promise<T[]>
  size?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export function useOffsetList<T>(options: UseOffsetListOptions<T>) {
  const size = options.size ?? 20
  const searchQuery = ref('')
  const debouncedQuery = ref('')

  let searchTimeout: ReturnType<typeof setTimeout>
  watch(searchQuery, (value) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      debouncedQuery.value = value
    }, 300)
  })

  const queryKey = computed(() => [
    ...options.queryKey,
    debouncedQuery.value,
    options.sortBy ?? 'name',
    options.order ?? 'asc',
  ] as const)

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<T[], Error, T[], readonly unknown[], number>({
    queryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }: QueryFunctionContext<readonly unknown[], number>) =>
      options.queryFn({
        offset: pageParam,
        size,
        name: debouncedQuery.value || undefined,
        sort_by: options.sortBy ?? 'name',
        order: options.order ?? 'asc',
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === size ? allPages.length * size : undefined,
  })

  const items = computed(() => {
    if (!data.value) return []
    const infiniteData = data.value as unknown as { pages: T[][] }
    return infiniteData.pages.flat()
  })

  const { showError, errorMessage } = useErrorHandler(error)

  function updateSearch(value: string | null) {
    searchQuery.value = value ?? ''
  }

  function loadMore() {
    if (hasNextPage.value && !isFetchingNextPage.value) {
      void fetchNextPage()
    }
  }

  return {
    items,
    isLoading,
    isFetchingNextPage,
    hasMore: hasNextPage,
    loadMore,
    showError,
    errorMessage,
    searchQuery,
    debouncedSearch: updateSearch,
  }
}
