import { computed, ref, unref, watch, type MaybeRef } from 'vue'
import { useInfiniteQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { useErrorHandler } from '@mentor-forge/mentorhub_spa_utils'
import type { ListParams } from '@/api/types'

type SearchParam = 'name' | 'description' | 'url' | 'interests' | 'technologies' | 'skill_level'

interface UseOffsetListOptions<T> {
  queryKey: readonly unknown[]
  queryFn: (params: ListParams) => Promise<T[]>
  size?: number
  sortBy?: string
  order?: 'asc' | 'desc'
  searchParam?: MaybeRef<SearchParam>
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
    unref(options.searchParam) ?? 'name',
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
    queryFn: ({ pageParam }: QueryFunctionContext<readonly unknown[], number>) => {
      const params: ListParams = {
        offset: pageParam,
        size,
        sort_by: options.sortBy ?? 'name',
        order: options.order ?? 'asc',
      }

      if (debouncedQuery.value) {
        params[unref(options.searchParam) ?? 'name'] = debouncedQuery.value
      }

      return options.queryFn(params)
    },
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
