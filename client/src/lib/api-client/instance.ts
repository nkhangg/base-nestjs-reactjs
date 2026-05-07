import axios, { type AxiosError } from 'axios'
import { ENV } from '@config/env'
import { storage } from '@lib/storage'
import { handleApiError } from '@lib/error-handler'

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = storage.get<string>(ENV.TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login')

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      try {
        return await apiClient(originalRequest)
      } catch {
        window.location.href = '/login'
      }
    }

    return Promise.reject(handleApiError(error))
  },
)
