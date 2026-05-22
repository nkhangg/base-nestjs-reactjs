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
    let currentSocket: ReturnType<typeof io>

    const connect = () => {
      currentSocket?.disconnect()
      const s = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        // Polling trước để initial handshake gửi cookie qua HTTP, sau đó upgrade WebSocket
        transports: ['polling', 'websocket'],
        reconnectionDelay: 3000,
        reconnectionDelayMax: 15000,
        reconnectionAttempts: 20,
      })
      s.on('connect', () => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT })
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.LIST })
      })
      s.on('notification', (payload: SocketNotificationPayload) => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.LIST })
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT })
        toast.info(payload.title, { description: payload.body })
      })
      currentSocket = s
    }

    connect()

    // Khi axios interceptor refresh token thành công, re-handshake WS với cookie mới
    const handleTokenRefresh = () => connect()
    window.addEventListener('auth:token-refreshed', handleTokenRefresh)

    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefresh)
      currentSocket?.disconnect()
    }
  }, [queryClient])
}
