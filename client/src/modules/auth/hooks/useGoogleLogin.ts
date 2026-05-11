'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ENV } from '@config/env'
import { ROUTES } from '@config/routes'
import { QUERY_KEYS } from '@shared/constants'
import { authService } from '../services/auth.service'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

interface GoogleTokenResponse {
  access_token?: string
  error?: string
}

interface GoogleTokenClient {
  requestAccessToken: () => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: GoogleTokenResponse) => void
            error_callback?: (error: { type?: string }) => void
          }) => GoogleTokenClient
        }
      }
    }
  }
}

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  if (window.google?.accounts?.oauth2) return Promise.resolve()

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('GIS load failed')), { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('GIS load failed'))
    document.head.appendChild(script)
  })
}

export function useGoogleLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadGisScript()
      .then(() => {
        if (!cancelled) setIsReady(true)
      })
      .catch(() => {
        if (!cancelled) toast.error('Không tải được Google SDK. Vui lòng thử lại.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(() => {
    if (!ENV.GOOGLE_CLIENT_ID) {
      toast.error('Google login chưa được cấu hình (NEXT_PUBLIC_GOOGLE_CLIENT_ID).')
      return
    }
    const oauth2 = window.google?.accounts?.oauth2
    if (!oauth2) {
      toast.error('Google SDK chưa sẵn sàng, vui lòng thử lại.')
      return
    }

    setIsLoading(true)
    const client = oauth2.initTokenClient({
      client_id: ENV.GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (response) => {
        try {
          if (!response.access_token) {
            toast.error('Không lấy được access token từ Google.')
            return
          }
          await authService.oauthLogin({
            provider: 'google',
            accessToken: response.access_token,
            type: 'user',
            deviceName: navigator.userAgent,
          })
          await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.ME })
          router.push(ROUTES.DASHBOARD)
        } catch {
          toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.')
        } finally {
          setIsLoading(false)
        }
      },
      error_callback: (error) => {
        setIsLoading(false)
        if (error.type === 'popup_closed') return
        toast.error('Không mở được popup Google. Vui lòng cho phép popup từ trang này.')
      },
    })
    client.requestAccessToken()
  }, [queryClient, router])

  return { login, isReady, isLoading }
}
