import axios, { type AxiosError } from 'axios'
import { ENV } from '@config/env'
import { storage } from '@lib/storage'
import { handleApiError } from '@lib/error-handler'

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Request: attach token ──────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = storage.get<string>(ENV.TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: handle errors + token refresh ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = storage.get<string>(ENV.REFRESH_TOKEN_KEY)
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, { refreshToken })
        storage.set(ENV.TOKEN_KEY, data.accessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        }
        return apiClient(originalRequest)
      } catch {
        storage.remove(ENV.TOKEN_KEY)
        storage.remove(ENV.REFRESH_TOKEN_KEY)
        window.location.href = '/login'
      }
    }

    return Promise.reject(handleApiError(error))
  },
)
