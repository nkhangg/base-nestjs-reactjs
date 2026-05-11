'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { ENV } from '@config/env'
import { QUERY_KEYS } from '@shared/constants'
import type { SocketNotificationPayload } from '../types'

export function useNotificationSocket() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socketUrl = ENV.API_BASE_URL.replace(/\/$/, '').replace(/\/api$/, '')
    const socket = io(`${socketUrl}/notifications`, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnectionDelay: 3000,
      reconnectionDelayMax: 15000,
      reconnectionAttempts: 20,
    })

    socket.on('connect', () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.LIST })
    })

    socket.on('notification', (payload: SocketNotificationPayload) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.LIST })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT })
      toast.info(payload.title, { description: payload.body })
    })

    return () => {
      socket.disconnect()
    }
  }, [queryClient])
}
