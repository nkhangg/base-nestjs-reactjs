import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@shared/constants'
import { notificationService } from '../services/notification.service'

export function useSendNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.sendNotification,
    onSuccess: () => {
      toast.success('Gửi thông báo thành công')
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.SENT })
    },
    onError: () => {
      toast.error('Gửi thông báo thất bại')
    },
  })
}
