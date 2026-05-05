import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@shared/constants'
import { notificationService } from '../services/notification.service'

export function useUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT,
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60_000,
  })
}
