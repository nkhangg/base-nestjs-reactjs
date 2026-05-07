import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@shared/constants'
import { progressService, type LeaderboardPeriod } from '../services/progress.service'

export function useUserProgress(userId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROGRESS.USER_ACTIVITY, userId],
    queryFn: () => progressService.getUserActivityLogs(userId!),
    enabled: !!userId,
    throwOnError: false,
    meta: {
      onError: () => toast.error('Không thể tải dữ liệu tiến độ. Vui lòng thử lại.'),
    },
  })
}

export function useLeaderboard(type: LeaderboardPeriod = 'all-time') {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROGRESS.LEADERBOARD, type],
    queryFn: () => progressService.getLeaderboard(type),
    staleTime: 10 * 60 * 1000,
  })
}
