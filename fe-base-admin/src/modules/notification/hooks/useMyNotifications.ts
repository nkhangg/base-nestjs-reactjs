import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@shared/constants'
import { notificationService } from '../services/notification.service'

export function useMyNotifications(params?: {
  page?: number
  limit?: number
  isRead?: boolean
  search?: string
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.NOTIFICATIONS.LIST, params],
    queryFn: () => notificationService.getMyNotifications(params),
  })
}
