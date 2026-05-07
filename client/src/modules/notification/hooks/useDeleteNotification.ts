'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@shared/constants'
import { notificationService } from '../services/notification.service'

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      toast.success('Đã xóa thông báo')
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.LIST })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT })
    },
  })
}
