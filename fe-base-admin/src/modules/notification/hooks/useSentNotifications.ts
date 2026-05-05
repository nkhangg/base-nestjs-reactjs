import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { QUERY_KEYS } from '@shared/constants'
import { notificationService } from '../services/notification.service'

export function useSentNotifications(params: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.NOTIFICATIONS.SENT, JSON.stringify(params)],
    queryFn: () => notificationService.getSentNotifications(params),
    placeholderData: keepPreviousData,
  })
}

export function useInvalidateSentNotifications() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.SENT })
}
