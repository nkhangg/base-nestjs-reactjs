import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@shared/constants'
import { healthService } from '../services/health.service'

export const useHealthCheck = () =>
  useQuery({
    queryKey: QUERY_KEYS.HEALTH,
    queryFn: async () => {
      const res = await healthService.check()
      return res.data
    },
    refetchInterval: 30_000,
    retry: false,
  })
