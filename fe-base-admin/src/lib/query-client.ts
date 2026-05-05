import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const onPermissionError = (error: unknown) => {
  const status = (error as { status?: number })?.status
  if (status === 403) {
    toast.error('Bạn không có quyền thực hiện thao tác này', { id: 'permission-denied' })
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onPermissionError }),
  mutationCache: new MutationCache({ onError: onPermissionError }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
